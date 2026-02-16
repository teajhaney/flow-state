import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../ai/gemini.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private geminiService: GeminiService,
  ) {}

  // --- Session Management ---

  async startSession(userId: string, task: string) {
    this.logger.log(`Starting session for user ${userId}: ${task}`);
    return this.prisma.session.create({
      data: {
        userId,
        task,
        startedAt: new Date(),
      },
    });
  }

  async endSession(userId: string, sessionId: string) {
    this.logger.log(`Ending session ${sessionId} for user ${userId}`);

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId, userId },
      include: { events: true },
    });

    if (!session) throw new NotFoundException('Session not found');

    // Calculate final focus score based on events
    // Focus Score = (Total Events - Distraction Events) / Total Events * 100
    // (Or 100 if no events)
    let focusScore = 100;
    if (session.events.length > 0) {
      const distractions = session.events.filter(
        (e) => e.type === 'distraction',
      ).length;
      focusScore = Math.round(
        ((session.events.length - distractions) / session.events.length) * 100,
      );
    }

    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        focusScore,
      },
    });
  }

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20, // Return last 20 sessions for dashboard history
    });
  }

  async getSession(userId: string, sessionId: string) {
    return this.prisma.session.findUnique({
      where: { id: sessionId, userId },
      include: { events: true },
    });
  }

  // --- Frame Processing ---

  async processFrame(
    userId: string,
    image: string,
    timestamp: string,
    apiKey?: string,
    model?: string,
    sessionId?: string,
  ) {
    this.logger.log(`Processing frame for session ${sessionId}`);

    // Analyze frame with Gemini AI
    const analysis = await this.geminiService.analyzeFrame(
      image,
      apiKey,
      model,
    );

    // If session ID provided and analysis was successful (confidence > 0), save event
    if (sessionId && analysis.confidence > 0) {
      // Check if session exists and belongs to user first to avoid errors
      // (Optional optimization: catch ensure session exists)
      try {
        await this.prisma.event.create({
          data: {
            sessionId,
            type: analysis.distracted ? 'distraction' : 'focus',
            message:
              analysis.reason ||
              (analysis.distracted
                ? 'Distraction detected'
                : 'Focus maintained'),
            confidence: analysis.confidence,
            createdAt: new Date(),
          },
        });
      } catch (err: any) {
        this.logger.warn(
          `Failed to save event for session ${sessionId}: ${err.message}`,
        );
      }
    }

    return {
      processed: true,
      timestamp,
      analysis,
    };
  }

  // Placeholder audio processing
  async processAudio(userId: string, audio: string, timestamp: string) {
    return {
      processed: true,
      timestamp,
    };
  }

  // Legacy dashboard stats
  async getSessionStats(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, endedAt: { not: null } },
    });
    const totalSessions = sessions.length;
    const avgScore =
      totalSessions > 0
        ? Math.round(
            sessions.reduce((acc, s) => acc + (s.focusScore || 0), 0) /
              totalSessions,
          )
        : 0;

    return {
      totalSessions,
      avgFlowScore: avgScore,
    };
  }
}
