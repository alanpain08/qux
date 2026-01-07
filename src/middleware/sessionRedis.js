const { session } = require('telegraf');
const Redis = require('ioredis');
const { redisUrl } = require('../config');

const redis = new Redis(redisUrl);
const ONE_DAY = 60 * 60 * 24;

const store = {
  async get(key) {
    const json = await redis.get(key);
    return json ? JSON.parse(json) : undefined;
  },
  async set(key, value) {
    await redis.set(key, JSON.stringify(value), 'EX', ONE_DAY);
  },
  async delete(key) {
    await redis.del(key);
  },
};

module.exports = () => session({ store });
