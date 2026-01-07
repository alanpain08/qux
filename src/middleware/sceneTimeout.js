// Прерывает "зависшую" сцену, если пользователь молчал дольше ms.
// Ход: проверка ДО next(); метка активности — сразу, чтобы фиксировалась при любом исходе.

function sceneTimeout(ms) {
  return async (ctx, next) => {
    const now = Date.now();
    if (ctx.session?.lastActivity && now - ctx.session.lastActivity > ms && ctx.scene?.current) {
      await ctx.reply('⌛ Время ожидания истекло. Наберите /start, чтобы начать заново.');
      await ctx.scene.leave();
    }
    if (ctx.session) ctx.session.lastActivity = now;
    return next();
  };
}

module.exports = sceneTimeout;
