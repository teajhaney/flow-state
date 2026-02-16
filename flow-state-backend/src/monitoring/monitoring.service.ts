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

  private computeFocusScore(events: { type: string }[]) {
    if (events.length === 0) return 100;
    const distractions = events.filter((e) => e.type === 'distraction').length;
    return Math.round(((events.length - distractions) / events.length) * 100);
  }

  private analyzeWavRms(buffer: Buffer) {
    if (buffer.length < 44) return null;
    if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
    if (buffer.toString('ascii', 8, 12) !== 'WAVE') return null;

    let offset = 12;
    let audioFormat: number | null = null;
    let numChannels: number | null = null;
    let sampleRate: number | null = null;
    let bitsPerSample: number | null = null;
    let dataOffset: number | null = null;
    let dataSize: number | null = null;

    while (offset + 8 <= buffer.length) {
      const chunkId = buffer.toString('ascii', offset, offset + 4);
      const chunkSize = buffer.readUInt32LE(offset + 4);
      const chunkDataOffset = offset + 8;

      if (chunkId === 'fmt ') {
        audioFormat = buffer.readUInt16LE(chunkDataOffset);
        numChannels = buffer.readUInt16LE(chunkDataOffset + 2);
        sampleRate = buffer.readUInt32LE(chunkDataOffset + 4);
        bitsPerSample = buffer.readUInt16LE(chunkDataOffset + 14);
      } else if (chunkId === 'data') {
        dataOffset = chunkDataOffset;
        dataSize = chunkSize;
        break;
      }

      offset = chunkDataOffset + chunkSize + (chunkSize % 2);
    }

    if (
      audioFormat !== 1 ||
      bitsPerSample !== 16 ||
      dataOffset === null ||
      dataSize === null
    ) {
      return null;
    }

    const sampleCount = Math.floor(dataSize / 2);
    if (sampleCount === 0) return null;

    let sumSquares = 0;
    for (let i = 0; i < sampleCount; i++) {
      const sample = buffer.readInt16LE(dataOffset + i * 2);
      const normalized = sample / 32768;
      sumSquares += normalized * normalized;
    }

    const rms = Math.sqrt(sumSquares / sampleCount);
    const durationMs =
      sampleRate && numChannels
        ? Math.round((sampleCount / (sampleRate * numChannels)) * 1000)
        : null;

    return { rms, durationMs };
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

  async processAudio(
    userId: string,
    audio: string,
    timestamp: string,
    sessionId?: string,
  ) {
    if (!audio) {
      return {
        processed: true,
        timestamp,
        analysis: {
          distracted: false,
          confidence: 0,
          reason: 'No audio payload provided',
        },
      };
    }

    const base64 = audio.includes(',') ? audio.split(',')[1] : audio;
    let analysis: {
      distracted: boolean;
      confidence: number;
      reason: string;
      level?: number;
    };

    try {
      const buffer = Buffer.from(base64, 'base64');
      const rmsResult = this.analyzeWavRms(buffer);

      if (!rmsResult) {
        analysis = {
          distracted: false,
          confidence: 0,
          reason: 'Unsupported audio format (expected PCM WAV)',
        };
      } else {
        const { rms, durationMs } = rmsResult;
        const level = Math.min(1, rms);
        const distracted = level >= 0.15;
        const confidence = Math.min(100, Math.round(level * 200));
        analysis = {
          distracted,
          confidence,
          level,
          reason: distracted
            ? `High ambient noise detected${durationMs ? ` (~${durationMs}ms)` : ''}`
            : 'Ambient noise low',
        };
      }
    } catch (error: any) {
      this.logger.warn(`Audio processing failed: ${error?.message || error}`);
      analysis = {
        distracted: false,
        confidence: 0,
        reason: 'Audio processing failed',
      };
    }

    if (sessionId && analysis.confidence > 0) {
      try {
        await this.prisma.event.create({
          data: {
            sessionId,
            type: analysis.distracted ? 'distraction' : 'focus',
            message: analysis.reason,
            confidence: analysis.confidence,
            createdAt: new Date(),
          },
        });
      } catch (err: any) {
        this.logger.warn(
          `Failed to save audio event for session ${sessionId}: ${err.message}`,
        );
      }
    }

    return {
      processed: true,
      timestamp,
      analysis,
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

    const activeSession = await this.prisma.session.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      include: { events: true },
    });

    const now = Date.now();
    const activeDurationSeconds = activeSession
      ? Math.max(
          0,
          Math.floor((now - activeSession.startedAt.getTime()) / 1000),
        )
      : 0;
    const currentFlowScore = activeSession
      ? this.computeFocusScore(activeSession.events)
      : 0;

    return {
      totalSessions,
      avgFlowScore: avgScore,
      activeSession: activeSession
        ? {
            id: activeSession.id,
            task: activeSession.task,
            startedAt: activeSession.startedAt,
          }
        : null,
      currentFlowScore,
      sessionDurationSeconds: activeDurationSeconds,
    };
  }
}
