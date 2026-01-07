require('dotenv').config();

const toNum = (name, def, { min = 0 } = {}) => {
  const raw = process.env[name]?.replace(/_/g, '');
  const n = raw === undefined ? def : Number(raw);
  if (!Number.isFinite(n) || n < min) throw new Error(`Env var ${name} must be a number ≥ ${min}`);
  return n;
};

const getMs = (name, defSec) => toNum(name, defSec, { min: 1 }) * 1000;

['TOKEN', 'ADMIN_CHAT_ID', 'GROUP_ID', 'THREAD_ID', 'MONGO_URI'].forEach(k => {
  if (!process.env[k]) throw new Error(`Env var ${k} is missing`);
});

module.exports = {
  token: process.env.TOKEN,
  adminChatId: Number(process.env.ADMIN_CHAT_ID),
  groupId: Number(process.env.GROUP_ID),
  threadId: Number(process.env.THREAD_ID),

  // База/кэш
  mongoUri: process.env.MONGO_URI,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Лимиты ввода полей
  limits: {
    titleMin: toNum('TITLE_MIN', 3),
    titleMax: toNum('TITLE_MAX', 120),
    descMin: toNum('DESC_MIN', 10),
    descMax: toNum('DESC_MAX', 2500),
    contactMin: toNum('CONTACT_MIN', 3),
    contactMax: toNum('CONTACT_MAX', 100),
  },

  // Таймаут визарда (мс)
  timeouts: {
    userWait: getMs('USER_WAIT_SEC', 10 * 60), // дефолт 10 минут
  },

  // Rate-limit
  rate: {
    maxCount: toNum('LIMIT_COUNT', 10, { min: 1 }),
    windowSec: toNum('LIMIT_WINDOW', 60 * 60, { min: 1 }), // дефолт 1 час
  },
};
