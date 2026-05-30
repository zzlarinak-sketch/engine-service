import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: 'engine_service_secret_key',
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
