import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { WinstonModuleOptions } from 'nest-winston';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');

/**
 * Custom printf format for human-readable console output in development.
 * Displays timestamp, level, context (NestJS class name), and message.
 */
const devConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    const ctx = context ? `[${context as string}]` : '[Application]';
    const traceStr = trace ? `\n${trace as string}` : '';
    return `${timestamp as string} ${level} ${ctx} ${message as string}${traceStr}`;
  }),
);

/**
 * Structured JSON format for production — machine-parsable by log aggregators
 * (e.g., ELK Stack, Datadog, CloudWatch).
 */
const prodJsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

/**
 * Daily rotate transport for error-level logs only.
 * Files: logs/error-YYYY-MM-DD.log, retained for 30 days, max 20MB each.
 */
const errorRotateTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: prodJsonFormat,
  zippedArchive: true,
});

/**
 * Daily rotate transport for all log levels.
 * Files: logs/combined-YYYY-MM-DD.log, retained for 14 days, max 20MB each.
 */
const combinedRotateTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: prodJsonFormat,
  zippedArchive: true,
});

/**
 * Build Winston options based on NODE_ENV.
 * - development: colorized console + file rotation
 * - production:  JSON console + file rotation (no colors)
 */
export const winstonConfig: WinstonModuleOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    // Console transport — pretty in dev, JSON in prod
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production' ? prodJsonFormat : devConsoleFormat,
    }),
    // File transports — always structured JSON
    errorRotateTransport,
    combinedRotateTransport,
  ],
  // Catch unhandled exceptions & rejections so the process doesn't silently die
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: prodJsonFormat,
      zippedArchive: true,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: prodJsonFormat,
      zippedArchive: true,
    }),
  ],
};
