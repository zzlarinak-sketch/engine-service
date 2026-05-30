import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
