const { Scenes, Markup } = require('telegraf');
const cfg = require('../config');
const { expectText, buildPost } = require('../utils');
const ACTIONS = require('../actions');
const moderation = require('../services/moderation');
const startHandler = require('../handlers/start');

const t = {
  title: `✏️ Введите заголовок:\n\n
  <i>Например: Нужен впн</i>`,
  desc: `✏️ Введите описание:\n\n
  <i>Например: Необходимо создать впн на vless</i>`,
  contact: `✏️ Укажите контакты:\n\n
  <i>Например: tg: @example, телефон: 89998887766, email: example@mail.ru</i>`,
};

const editPrompts = {
  [ACTIONS.EDIT_TYPE]: '✏️ Укажите новый тип объявления:',
  [ACTIONS.EDIT_TITLE]: '✏️ Укажите новый заголовок:',
  [ACTIONS.EDIT_DESC]: '✏️ Укажите новое описание:',
  [ACTIONS.EDIT_CONTACT]: '✏️ Укажите новый номер:',
};

const sendPreview = async ctx => {
  const html = buildPost(ctx.wizard.state);
  ctx.wizard.state.finalContent = html;

  await ctx.replyWithHTML(
    `✅ Проверьте объявление:\n\n${html}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Отправить', ACTIONS.PUBLISH)],
      [Markup.button.callback('🚫 Отмена', ACTIONS.CANCEL)],
      [Markup.button.callback('📝 Изменить', ACTIONS.EDIT)],
    ]),
  );
};

const handleStartCommand = async ctx => {
  if (ctx.message?.text !== '/start') return false;
  await ctx.scene.leave();
  await startHandler(ctx);
  return true;
};

const handleCancelAction = async ctx => {
  await ctx.reply('Отправка объявления отменена. Для создания нового отправьте команду /start');
  await ctx.scene.leave();
};

module.exports = new Scenes.WizardScene(
  'POST_SCENE',

  // Шаг 1 — спрашиваем заголовок
  async ctx => {
    ctx.wizard.state.postType = ctx.scene.state.postType;
    await ctx.replyWithHTML(t.title);
    return ctx.wizard.next();
  },

  // Шаг 2 — принимаем и валидируем заголовок, спрашиваем описание
  async ctx => {
    if (await handleStartCommand(ctx)) return;
    if (
      !(await expectText(ctx, {
        min: cfg.limits.titleMin,
        max: cfg.limits.titleMax,
        emptyMsg: `❗Пришлите заголовок`,
        tooLongMsg: len =>
          `❗Заголовок должен быть меньше ${cfg.limits.titleMax} символов. У вас на данный момент ${len}`,
      }))
    )
      return; // остаёмся на том же шаге

    ctx.wizard.state.title = ctx.message.text;
    await ctx.replyWithHTML(t.desc);
    return ctx.wizard.next();
  },

  // Шаг 3 — принимаем и валидируем описание, спрашиваем контакты
  async ctx => {
    if (await handleStartCommand(ctx)) return;
    if (
      !(await expectText(ctx, {
        min: cfg.limits.descMin,
        max: cfg.limits.descMax,
        emptyMsg: `❗Пришлите описание`,
        tooLongMsg: len =>
          `❗Описание должно быть меньше ${cfg.limits.descMax} символов. У вас на данный момент ${len}`,
      }))
    )
      return;

    ctx.wizard.state.description = ctx.message.text;
    await ctx.replyWithHTML(t.contact);
    return ctx.wizard.next();
  },

  // Шаг 4 — принимаем контакты, показываем предпросмотр с кнопками
  async ctx => {
    if (await handleStartCommand(ctx)) return;
    if (
      !(await expectText(ctx, {
        min: cfg.limits.contactMin,
        max: cfg.limits.contactMax,
        emptyMsg: `❗Укажите контакты`,
        tooLongMsg: len =>
          `❗Контакты должны быть меньше ${cfg.limits.contactMax} симв. У вас на данный момент ${len}`,
      }))
    )
      return;

    ctx.wizard.state.contacts = ctx.message.text;

    await sendPreview(ctx);

    return ctx.wizard.next();
  },

  // Шаг 5 — обрабатываем кнопки
  async ctx => {
    if (await handleStartCommand(ctx)) return;
    if (!ctx.callbackQuery) return;
    const action = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (action === ACTIONS.CANCEL) {
      await handleCancelAction(ctx);
      return;
    }

    if (action === ACTIONS.PUBLISH) {
      await ctx.reply(
        '⏳… Отправляю на модерацию. Как только администратор проверит, ваше объявление будет опубликовано',
      );
      await moderation.sendForReview(ctx, ctx.wizard.state.finalContent);
      return ctx.scene.leave();
    }

    if (action === ACTIONS.EDIT) {
      await ctx.reply(
        'Что необходимо отредактировать?',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('Тип объявления', ACTIONS.EDIT_TYPE),
            Markup.button.callback('Заголовок', ACTIONS.EDIT_TITLE),
          ],
          [
            Markup.button.callback('Описание', ACTIONS.EDIT_DESC),
            Markup.button.callback('Телефон', ACTIONS.EDIT_CONTACT),
          ],
        ]),
      );
      return;
    }

    if (editPrompts[action]) {
      ctx.wizard.state.editField = action;
      if (action === ACTIONS.EDIT_TYPE) {
        await ctx.replyWithHTML(
          editPrompts[action],
          Markup.inlineKeyboard([
            [
              Markup.button.callback('Вакансия', ACTIONS.JOB),
              Markup.button.callback('Заказ', ACTIONS.ORDER),
            ],
          ]),
        );
      } else {
        await ctx.reply(editPrompts[action]);
      }
      return ctx.wizard.next();
    }
  },

  // Шаг 6 — принимаем новый текст для редактирования и показываем предпросмотр
  async ctx => {
    if (await handleStartCommand(ctx)) return;
    const field = ctx.wizard.state.editField;
    if (!field) return;

    if (field === ACTIONS.EDIT_TYPE) {
      await ctx.answerCbQuery();
      ctx.wizard.state.postType = ctx.callbackQuery.data === ACTIONS.JOB ? 'Вакансия' : 'Заказ';
    }

    if (field === ACTIONS.EDIT_TITLE) {
      if (
        !(await expectText(ctx, {
          min: cfg.limits.titleMin,
          max: cfg.limits.titleMax,
          emptyMsg: `❗Введите заголовок (≥ ${cfg.limits.titleMin} симв.)`,
          tooLongMsg: len => `❗Заголовок ${len} симв. — максимум ${cfg.limits.titleMax}`,
        }))
      )
        return;
      ctx.wizard.state.title = ctx.message.text;
    }

    if (field === ACTIONS.EDIT_DESC) {
      if (
        !(await expectText(ctx, {
          min: cfg.limits.descMin,
          max: cfg.limits.descMax,
          emptyMsg: `❗Введите описание (≥ ${cfg.limits.descMin} симв.)`,
          tooLongMsg: len => `❗Описание ${len} симв. — максимум ${cfg.limits.descMax}`,
        }))
      )
        return;
      ctx.wizard.state.description = ctx.message.text;
    }

    if (field === ACTIONS.EDIT_CONTACT) {
      if (
        !(await expectText(ctx, {
          min: cfg.limits.contactMin,
          max: cfg.limits.contactMax,
          emptyMsg: 'Укажите новый номер:',
          tooLongMsg: len => `❗Контакты ${len} симв. — максимум ${cfg.limits.contactMax}`,
        }))
      )
        return;
      ctx.wizard.state.contacts = ctx.message.text;
    }

    ctx.wizard.state.editField = null;
    await sendPreview(ctx);
    return ctx.wizard.selectStep(4);
  },
);
