import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    return next.handle().pipe(
      tap(async () => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user?.id,
              action: `${method} ${url}`,
              resource: context.getClass().name,
              resourceId: request.params?.id,
              ipAddress: ip,
              userAgent: headers['user-agent'],
            },
          });
        } catch {
          // Don't let audit logging failures break requests
        }
      }),
    );
  }
}
