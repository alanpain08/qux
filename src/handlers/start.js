// /start — приветствие и выбор типа объявления.

const { Markup } = require('telegraf');
const ACTIONS = require('../actions');

module.exports = ctx => {
  ctx.replyWithHTML(
    `👋 Привет, <b>${ctx.from.first_name}</b>!\nВыберите тип объявления:`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('💼 Вакансия', ACTIONS.JOB),
        Markup.button.callback('🛍️ Заказ', ACTIONS.ORDER),
      ],
    ]),
  );
};
