/**
 * @file utils/logger.ts
 * @description Logger customizado para controlar logs em produção
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = __DEV__;

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log informativo
   */
  info(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.info(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  /**
   * Log de aviso
   */
  warn(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  /**
   * Log de erro (sempre ativo, mesmo em produção)
   */
  error(message: string, error?: any): void {
    console.error(`❌ [ERROR] ${message}`, error);
    
    // Aqui você pode integrar com Sentry/LogRocket em produção
    // if (!this.isDev) {
    //   Sentry.captureException(error, { extra: { message } });
    // }
  }

  /**
   * Log de performance (tempo de execução)
   */
  time(label: string): void {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }
}

export default new Logger();
