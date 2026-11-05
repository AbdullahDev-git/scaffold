/**
 * Structured logger for Scaffold.
 *
 * Levels: debug, info, warn, error.
 * In production, errors are also captured by Sentry (if configured).
 * All output is JSON on a single line for easy log aggregation.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel: LogLevel =
  process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) return;

  const entry: Record<string, unknown> = {
    level,
    message,
    ts: new Date().toISOString(),
    env: process.env.NODE_ENV,
  };

  if (data) entry.data = data;

  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}

export function debug(message: string, data?: Record<string, unknown>) {
  log('debug', message, data);
}

export function info(message: string, data?: Record<string, unknown>) {
  log('info', message, data);
}

export function warn(message: string, data?: Record<string, unknown>) {
  log('warn', message, data);
}

export function error(message: string, data?: Record<string, unknown>) {
  log('error', message, data);
}
