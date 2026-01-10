// Вся бизнес-логика модерации в одном месте: отправка админу, approve/reject.
// Сервис знает про БД и Telegram-API, а сцена — нет (SRP).

const { Markup } = require('telegraf');
const { nanoid } = require('nanoid');
const Post = require('../models/Post');
const User = require('../models/User');
const ACTIONS = require('../actions');
const logger = require('../logger');
const { adminChatId, groupId, threadId, botUrl } = require('../config');

// Кнопки для админа с постфиксом postId в callback-data
const adminKb = postId =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Одобрить', ACTIONS.MODERATION_APPROVE + postId),
      Markup.button.callback('❌ Отклонить', ACTIONS.MODERATION_REJECT + postId),
    ],
  ]).reply_markup;

async function sendForReview(ctx, html) {
  if (!ctx.from) throw new Error('ctx.from is undefined');

  const postId = nanoid(10);

  // Сохраняем пост в статусе pending
  await Post.create({ postId, userId: ctx.from.id, content: html, status: 'pending' });

  // Обновляем статистику пользователя (дата + счётчик)
  await User.findOneAndUpdate(
    { tgId: ctx.from.id },
    {
      $inc: { adCount: 1 },
      lastAdAt: new Date(),
      username: ctx.from.username,
      firstName: ctx.from.first_name,
    },
    { upsert: true },
  );

  // Отправляем админу
  try {
    await ctx.telegram.sendMessage(
      adminChatId,
      `❗️ Новое объявление от ${ctx.from.first_name}:\n\n${html}`,
      { parse_mode: 'HTML', reply_markup: adminKb(postId) },
    );
  } catch (e) {
    logger.error({ err: e }, 'Failed to send moderation message');
    throw e;
  }

  return postId;
}

async function approve(ctx, postId) {
  const post = await Post.findOne({ postId });
  if (!post) throw new Error('Post not found');

  try {
    await ctx.telegram.sendMessage(groupId, post.content, {
      parse_mode: 'HTML',
      message_thread_id: threadId,
      ...Markup.inlineKeyboard([
        [Markup.button.url('➕ Добавить объявление', `https://t.me/${botUrl}`)],
      ]),
    });
  } catch (e) {
    logger.error({ err: e }, 'Failed to publish to group');
    throw e;
  }

  post.status = 'approved';
  await post.save();

  // Уведомляем автора
  await ctx.telegram.sendMessage(post.userId, '🎉 Ваше объявление одобрено и опубликовано!');
}

async function reject(ctx, postId) {
  const post = await Post.findOne({ postId });
  if (!post) throw new Error('Post not found');

  post.status = 'rejected';
  await post.save();

  await ctx.telegram.sendMessage(
    post.userId,
    '😢 К сожалению, ваше объявление отклонено модератором.',
  );
}

module.exports = { sendForReview, approve, reject };
