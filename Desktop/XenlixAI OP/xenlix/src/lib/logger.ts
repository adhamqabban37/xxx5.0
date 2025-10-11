import { NextRequest } from 'next/server';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  email?: string;
  action: string;
  resource: string;
  metadata?: Record<string, any>;
  request?: {
    method: string;
    url: string;
    userAgent?: string;
    ip?: string;
  };
}

export class ServerLogger {
  private static instance: ServerLogger;

  static getInstance(): ServerLogger {
    if (!ServerLogger.instance) {
      ServerLogger.instance = new ServerLogger();
    }
    return ServerLogger.instance;
  }

  private formatLog(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(context && {
        userId: context.userId,
        sessionId: context.sessionId,
        email: context.email,
        action: context.action,
        resource: context.resource,
        metadata: context.metadata,
        request: context.request,
      }),
    };

    return JSON.stringify(logData);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      action: context?.action || 'error',
      resource: context?.resource || 'unknown',
      ...context,
      metadata: {
        ...context?.metadata,
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        },
      },
    };
    console.error(this.formatLog('error', message, errorContext));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  // Specific logging methods for different workflows
  logOnboarding(action: string, userId: string, data?: any): void {
    this.info(`Onboarding: ${action}`, {
      userId,
      action,
      resource: 'onboarding',
      metadata: data,
    });
  }

  logGuidance(action: string, userId: string, data?: any): void {
    this.info(`Guidance: ${action}`, {
      userId,
      action,
      resource: 'guidance',
      metadata: data,
    });
  }

  logAds(action: string, userId: string, data?: any): void {
    this.info(`Ads: ${action}`, {
      userId,
      action,
      resource: 'ads',
      metadata: data,
    });
  }

  logCheckout(action: string, userId: string, data?: any): void {
    this.info(`Checkout: ${action}`, {
      userId,
      action,
      resource: 'checkout',
      metadata: data,
    });
  }

  logSubscription(action: string, userId: string, data?: any): void {
    this.info(`Subscription: ${action}`, {
      userId,
      action,
      resource: 'subscription',
      metadata: data,
    });
  }

  logAuth(action: string, email?: string, data?: any): void {
    this.info(`Auth: ${action}`, {
      email,
      action,
      resource: 'auth',
      metadata: data,
    });
  }

  // Extract request context from NextRequest
  extractRequestContext(request: NextRequest): LogContext['request'] {
    return {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    };
  }
}

// Export singleton instance
export const logger = ServerLogger.getInstance();
