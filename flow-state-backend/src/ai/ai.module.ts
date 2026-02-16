import { Module, Global } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ConfigModule } from '@nestjs/config';

@Global() // Make it global so we can use it easily in MonitoringModule without re-importing everywhere
@Module({
  imports: [ConfigModule],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
