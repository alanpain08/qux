// Хендлеры нажатий админа: approve / reject.
// После клика — убираем клавиатуру у админского сообщения (editReplyMarkup({})).

const ACTIONS = require('../actions');
const { adminChatId } = require('../config');
const moderation = require('../services/moderation');
const logger = require('../logger');

module.exports = bot => {
  bot.action(new RegExp(`^${ACTIONS.MODERATION_APPROVE}(.*)$`), async ctx => {
    await ctx.answerCbQuery();
    if (ctx.from?.id !== adminChatId) {
      return ctx.reply('⛔️ Недостаточно прав.');
    }
    const postId = ctx.match[1];
    try {
      await moderation.approve(ctx, postId);
      await ctx.editMessageReplyMarkup({}); // убираем кнопки в админском сообщении
      await ctx.reply('✅ Объявление опубликовано.');
    } catch (e) {
      logger.error({ err: e }, 'Approve failed');
      await ctx.reply('⚠️ Не удалось опубликовать.');
    }
  });

  bot.action(new RegExp(`^${ACTIONS.MODERATION_REJECT}(.*)$`), async ctx => {
    await ctx.answerCbQuery();
    if (ctx.from?.id !== adminChatId) {
      return ctx.reply('⛔️ Недостаточно прав.');
    }
    const postId = ctx.match[1];
    try {
      await moderation.reject(ctx, postId);
      await ctx.editMessageReplyMarkup({});
      await ctx.reply('🛑 Объявление отклонено.');
    } catch (e) {
      logger.error({ err: e }, 'Reject failed');
      await ctx.reply('⚠️ Не удалось отклонить.');
    }
  });
};
