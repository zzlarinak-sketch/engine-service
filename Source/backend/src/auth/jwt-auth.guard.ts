import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Не передан токен авторизации');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'engine_service_secret_key',
      });

      request.user = payload;
    } catch {
      throw new UnauthorizedException('Неверный или устаревший токен');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      return undefined;
    }

    const [type, token] = authorizationHeader.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
