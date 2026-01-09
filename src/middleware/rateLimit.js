// Ограничение на количество действий в окно времени через Redis.
// INCR + EXPIRE обеспечивает атомарность и авто-сброс счётчика.
const cfg = require('../config');
const ACTIONS = require('../actions');

const { redisUrl } = require('../config');
const Redis = require('ioredis');

const redis = new Redis(redisUrl);

function rateLimit(limit, windowSec) {
  return async (ctx, next) => {
    if (!ctx.from || ctx.callbackQuery?.data !== ACTIONS.PUBLISH) return next();
    const key = `rate:post:${ctx.from.id}`;
    const cnt = await redis.incr(key);
    const ttl = await redis.ttl(key);
    if (cnt === 1 || ttl === -1) await redis.expire(key, windowSec); //ttl -1: нет таймера; -2: нет ключа

    if (ctx.from.id !== cfg.adminChatId && cnt > limit)
      return ctx.reply('📛 Лимит объявлений исчерпан: не более 10 за час. Попробуйте позже.');
    return next();
  };
}

module.exports = rateLimit;
