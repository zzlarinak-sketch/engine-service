import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { EnginesController } from './engines.controller';
import { EnginesService } from './engines.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EnginesController],
  providers: [EnginesService],
})
export class EnginesModule {}
