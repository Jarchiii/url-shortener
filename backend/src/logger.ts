import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

const level = isTest ? 'silent' : (process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'));

export const logger = pino({
  level,
  ...(isTest || isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
});
