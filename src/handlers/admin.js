// Хендлеры нажатий админа: approve / reject.
// После клика — убираем клавиатуру у админского сообщения (editReplyMarkup({})).

const ACTIONS = require('../actions');
const { adminChatId, groupId } = require('../config');
const moderation = require('../services/moderation');
const logger = require('../logger');
const Post = require('../models/Post');
const User = require('../models/User');

async function isGroupAdmin(ctx) {
  if (!ctx.from) return false;
  const admins = await ctx.telegram.getChatAdministrators(groupId);
  return admins.some(admin => admin.user?.id === ctx.from.id);
}

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

  bot.command('stats', async ctx => {
    try {
      if (!(await isGroupAdmin(ctx))) {
        return ctx.reply('⛔️ Недостаточно прав.');
      }
    } catch (e) {
      logger.error({ err: e }, 'Failed to check group admin rights');
      return ctx.reply('⚠️ Не удалось проверить права.');
    }

    try {
      const [usersTotal, approvedTotal, topPublisher] = await Promise.all([
        User.countDocuments(),
        Post.countDocuments({ status: 'approved' }),
        Post.aggregate([
          { $match: { status: 'approved' } },
          { $group: { _id: '$userId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]),
      ]);

      let topPublisherLabel = 'нет данных';
      if (topPublisher.length > 0) {
        const topPublisherId = topPublisher[0]._id;
        const topUser = await User.findOne({ tgId: topPublisherId });
        const username = topUser?.username ? `@${topUser.username}` : topUser?.firstName;
        topPublisherLabel = `${username || 'Без имени'} (${topPublisherId})`;
      }

      return ctx.reply(
        `Всего пользователей: ${usersTotal}, Всего объявлений: ${approvedTotal}, Самое большое количество объявлений: ${topPublisherLabel}`,
      );
    } catch (e) {
      logger.error({ err: e }, 'Failed to load stats');
      return ctx.reply('⚠️ Не удалось получить статистику.');
    }
  });
};
