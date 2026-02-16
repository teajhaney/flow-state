import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Patch,
  Param,
} from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/types/auth-types';

@UseGuards(JwtAuthGuard)
@Controller('monitoring')
export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  // --- Session Management ---

  @Post('sessions')
  async startSession(
    @Req() req: Request,
    @Body('task') task: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.monitoringService.startSession(user.userId, task);
  }

  @Patch('sessions/:id/end')
  async endSession(
    @Req() req: Request,
    @Param('id') sessionId: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.monitoringService.endSession(user.userId, sessionId);
  }

  @Get('sessions')
  async getSessions(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.monitoringService.getUserSessions(user.userId);
  }

  // --- Real-time Logic ---

  @Post('frame')
  async processFrame(
    @Req() req: Request,
    @Body('image') image: string,
    @Body('timestamp') timestamp: string,
    @Body('apiKey') apiKey?: string,
    @Body('model') model?: string,
    @Body('sessionId') sessionId?: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.monitoringService.processFrame(
      user.userId,
      image,
      timestamp,
      apiKey,
      model,
      sessionId,
    );
  }

  @Post('audio')
  async processAudio(
    @Req() req: Request,
    @Body('audio') audio: string,
    @Body('timestamp') timestamp: string,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.monitoringService.processAudio(user.userId, audio, timestamp);
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.monitoringService.getSessionStats(user.userId);
  }
}
