export class Logger {
  private static context = 'App';

  private static readonly COLORS: Record<string, string> = {
    INFO: '#3b82f6',
    WARN: '#f59e0b',
    ERROR: '#ef4444',
    DEBUG: '#a855f7',
  };

  static setContext(context: string) {
    Logger.context = context;
  }

  private static log(level: string, message: string, ...args: unknown[]) {
    const time = new Date().toLocaleTimeString();
    const color = Logger.COLORS[level] ?? '#6b7280';

    console.log(
      `%c[${time}] [${Logger.context}] [${level}]`,
      `color: ${color}; font-weight: bold;`,
      message,
      ...args
    );
  }

  static info(message: string, ...args: unknown[]) {
    Logger.log('INFO', message, ...args);
  }

  static warn(message: string, ...args: unknown[]) {
    Logger.log('WARN', message, ...args);
  }

  static error(message: string, ...args: unknown[]) {
    Logger.log('ERROR', message, ...args);
  }

  static debug(message: string, ...args: unknown[]) {
    Logger.log('DEBUG', message, ...args);
  }
}