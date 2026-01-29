const pino = require('pino');

const isDev = process.env.NODE_ENV == 'development';

const logger = pino({
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
});

module.exports = logger;
