// Утилиты: проверка текстовых полей и сборка HTML-поста с экранированием.

async function expectText(ctx, { min, max, emptyMsg, tooLongMsg }) {
  const text = ctx.message?.text.trim();

  if (!text || text.length < min) {
    ctx.reply(emptyMsg);
    return false;
  }
  if (text.length > max) {
    ctx.reply(tooLongMsg(text.length));
    return false;
  }
  return true;
}

// Мини-экранирование: защищаем HTML-parse_mode от "поломки" разметки.
function escape(text = '') {
  return text.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]);
}

function buildPost({ postType, title, description, contacts }) {
  return `
<b>${escape(postType)}</b>
🔹 <b>${escape(title)}</b>

📄 Описание:
${escape(description)}

📞 Контакты:
${escape(contacts)}
  `.trim();
}

module.exports = { expectText, escape, buildPost };
