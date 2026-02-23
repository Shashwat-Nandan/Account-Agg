import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyDetachedJws } from '@account-agg/shared';
import { readFileSync } from 'node:fs';

@Injectable()
export class JwsVerificationGuard implements CanActivate {
  private aaPublicKey: string | null = null;

  constructor(private readonly config: ConfigService) {
    const keyPath = this.config.get<string>('SETU_AA_PUBLIC_KEY_PATH');
    if (keyPath) {
      try {
        this.aaPublicKey = readFileSync(keyPath, 'utf-8');
      } catch {
        console.warn('AA public key not found at', keyPath);
      }
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.aaPublicKey) {
      // Skip verification in development if no key configured
      if (this.config.get('NODE_ENV') !== 'production') return true;
      throw new UnauthorizedException('AA public key not configured');
    }

    const request = context.switchToHttp().getRequest();
    const jwsSignature = request.headers['x-jws-signature'];

    if (!jwsSignature) {
      throw new UnauthorizedException('Missing x-jws-signature header');
    }

    const body = JSON.stringify(request.body);
    const valid = await verifyDetachedJws(jwsSignature, body, this.aaPublicKey);

    if (!valid) {
      throw new UnauthorizedException('Invalid JWS signature');
    }

    return true;
  }
}
