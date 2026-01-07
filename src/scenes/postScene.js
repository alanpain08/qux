const { Scenes, Markup } = require('telegraf');
const cfg = require('../config');
const { expectText, buildPost } = require('../utils');
const ACTIONS = require('../actions');
const moderation = require('../services/moderation');

const t = {
  title: '✏️ Введите заголовок:',
  desc: '📝 Введите описание:',
  contact: '📞 Укажите контакты:',
};

module.exports = new Scenes.WizardScene(
  'POST_SCENE',

  // Шаг 1 — спрашиваем заголовок
  async ctx => {
    console.log('-----------------1-----------------------', ctx);
    ctx.wizard.state.postType = ctx.scene.state.postType;
    await ctx.reply(t.title);
    return ctx.wizard.next();
  },

  // Шаг 2 — принимаем и валидируем заголовок, спрашиваем описание
  async ctx => {
    console.log('--------------------2-----------------', ctx);
    if (
      !expectText(ctx, {
        min: cfg.limits.titleMin,
        max: cfg.limits.titleMax,
        emptyMsg: `🔤 Введите заголовок (≥ ${cfg.limits.titleMin} симв.)`,
        tooLongMsg: len => `✂️ Заголовок ${len} симв. — максимум ${cfg.limits.titleMax}`,
      })
    )
      return; // остаёмся на том же шаге

    ctx.wizard.state.title = ctx.message.text;
    await ctx.reply(t.desc);
    return ctx.wizard.next();
  },

  // Шаг 3 — принимаем и валидируем описание, спрашиваем контакты
  async ctx => {
    console.log('---------------------3-----------------------------', ctx);
    if (
      !expectText(ctx, {
        min: cfg.limits.descMin,
        max: cfg.limits.descMax,
        emptyMsg: `📝 Введите описание (≥ ${cfg.limits.descMin} симв.)`,
        tooLongMsg: len => `✂️ Описание ${len} симв. — максимум ${cfg.limits.descMax}`,
      })
    )
      return;

    ctx.wizard.state.description = ctx.message.text;
    await ctx.reply(t.contact);
    return ctx.wizard.next();
  },

  // Шаг 4 — принимаем контакты, показываем предпросмотр с кнопками
  async ctx => {
    console.log('---------------------------4--------------------------------', ctx, ctx.message);
    if (
      !expectText(ctx, {
        min: cfg.limits.contactMin,
        max: cfg.limits.contactMax,
        emptyMsg: `📞 Укажите контакты`,
        tooLongMsg: len => `✂️ Контакты ${len} симв. — максимум ${cfg.limits.contactMax}`,
      })
    )
      return;

    ctx.wizard.state.contacts = ctx.message.text;

    const html = buildPost(ctx.wizard.state);
    ctx.wizard.state.finalContent = html;

    await ctx.replyWithHTML(
      `✅ Проверьте объявление:\n\n${html}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Назад', ACTIONS.BACK)],
        [Markup.button.callback('✅ Отправить', ACTIONS.PUBLISH)],
        [Markup.button.callback('❌ Отмена', ACTIONS.CANCEL)],
      ]),
    );

    return ctx.wizard.next();
  },

  // Шаг 5 — обрабатываем кнопки
  async ctx => {
    console.log('---------------------------5--------------------------', ctx);
    if (!ctx.callbackQuery) return;
    const action = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (action === ACTIONS.BACK) return ctx.wizard.back();

    if (action === ACTIONS.CANCEL) {
      await ctx.reply('🚫 Отменено. /start');
      return ctx.scene.leave();
    }

    if (action === ACTIONS.PUBLISH) {
      await ctx.reply('⏳ Отправляю на модерацию…');
      await moderation.sendForReview(ctx, ctx.wizard.state.finalContent);
      return ctx.scene.leave();
    }
  },
);
