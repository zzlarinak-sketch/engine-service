import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { EnginesModule } from './engines/engines.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { LogsModule } from './logs/logs.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UsersModule, EnginesModule, ServiceRequestsModule, LogsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
