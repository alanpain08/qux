// Точка входа: подключение БД, настройка middleware, регистрация команд и launch.

const { Telegraf, Scenes } = require('telegraf');
const mongoose = require('mongoose');
const logger = require('./logger');
const cfg = require('./config');

const postScene = require('./scenes/postScene');
const sessionRedis = require('./middleware/sessionRedis');
const sceneTimeout = require('./middleware/sceneTimeout');
const rateLimit = require('./middleware/rateLimit');
const startHandler = require('./handlers/start');
const adminHandlers = require('./handlers/admin');

const ACTIONS = require('./actions');
const User = require('./models/User');

(async () => {
  // 1) Mongo
  await mongoose.connect(cfg.mongoUri);
  logger.info('Mongo connected');

  // 2) Bot
  const bot = new Telegraf(cfg.token);
  const stage = new Scenes.Stage([postScene]);

  // 3) Middleware chain: sessions → timeout → rate-limit → scenes
  bot.use(sessionRedis());
  bot.use(sceneTimeout(cfg.timeouts.userWait));
  bot.use(rateLimit(cfg.rate.maxCount, cfg.rate.windowSec));
  bot.use(stage.middleware());

  // 4) Сохраняем/обновляем пользователя (минимальная аналитика)
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      await User.findOneAndUpdate(
        { tgId: ctx.from.id },
        {
          tgId: ctx.from.id,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
        },
        { upsert: true },
      );
    }
    return next();
  });

  // 5) Commands & actions
  bot.start(startHandler);

  bot.action([ACTIONS.JOB, ACTIONS.ORDER], ctx => {
    ctx.answerCbQuery();
    const postType = ctx.callbackQuery.data === ACTIONS.JOB ? '💼 Вакансия' : '🛍️ Заказ';
    ctx.scene.enter('POST_SCENE', { postType });
  });

  adminHandlers(bot);

  // 6) Глобальный catcher
  bot.catch((err, ctx) => {
    logger.error({ err }, 'Unhandled error');
    ctx.reply('⚠️ Ошибка. Попробуйте позже.');
  });

  // 7) Go
  await bot.launch();
  logger.info('🤖 Bot started');
})();
