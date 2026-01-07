// Ограничение на количество действий в окно времени через Redis.
// INCR + EXPIRE обеспечивает атомарность и авто-сброс счётчика.
const cfg = require('../config');

const { redisUrl } = require('../config');
const Redis = require('ioredis');

const redis = new Redis(redisUrl);

function rateLimit(limit, windowSec) {
  return async (ctx, next) => {
    if (!ctx.from) return next();

    const key = `rate:${ctx.from.id}`;
    const cnt = await redis.incr(key);
    if (cnt === 1) await redis.expire(key, windowSec);

    if (ctx.from.id !== cfg.adminChatId && cnt > limit)
      return ctx.reply('📛 Лимит объявлений исчерпан. Попробуйте позже.');
    return next();
  };
}

module.exports = rateLimit;
