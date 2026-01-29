# Ads Bot

Telegram-бот для создания объявлений пользователями и администрирования публикаций. Бот ведет пользователя по шагам, проверяет лимиты и отправляет объявления в модерацию/публикацию в заданный чат/тему.

## Возможности

- Мастер создания объявлений с валидацией полей (заголовок, описание, контакт)
- Ограничения по длине полей и rate-limit
- Администрирование публикаций через отдельный чат администратора
- Хранение данных в MongoDB и кэш/лимиты в Redis

## Технологии

- **Node.js 18+**
- **Telegraf** (Telegram Bot API)
- **MongoDB** (хранение объявлений)
- **Redis** (rate-limit и вспомогательные данные)
- **Pino** (логирование)
- **Docker / Docker Compose**
- **OpenAI Codex** (упомянут как применяемая технология/инструмент для разработки)

## Конфигурация окружения

Создайте файл `.env` в корне проекта и заполните обязательные переменные:

```env
TOKEN=your-telegram-bot-token
BOT_URL=https://your-domain-or-ngrok-url
ADMIN_CHAT_ID=123456789
GROUP_ID=-1001234567890
THREAD_ID=123
MONGO_URI=mongodb://localhost:27017/ads-bot
REDIS_URL=redis://localhost:6379

# Опционально
TITLE_MIN=3
TITLE_MAX=120
DESC_MIN=10
DESC_MAX=2500
CONTACT_MIN=3
CONTACT_MAX=100
USER_WAIT_SEC=600
LIMIT_COUNT=10
LIMIT_WINDOW=3600
LOG_LEVEL=info
```

> Обязательные переменные: `TOKEN`, `BOT_URL`, `ADMIN_CHAT_ID`, `GROUP_ID`, `THREAD_ID`, `MONGO_URI`.

## Локальный запуск (пошагово)

### Вариант 1: без Docker

1. Установите Node.js **18+** и npm.
2. Поднимите MongoDB и Redis локально (или используйте Docker):
   ```bash
   docker compose up -d mongo redis
   ```
3. Установите зависимости:
   ```bash
   npm install
   ```
4. Создайте `.env` (см. раздел выше).
5. Запустите бота в режиме разработки:
   ```bash
   npm run dev
   ```

### Вариант 2: через Docker Compose (dev)

1. Создайте `.env` (см. раздел выше).
2. Запустите окружение разработки:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

## Развертывание на сервере (пошагово)

### Вариант 1: Docker Compose (рекомендуется)

1. Установите Docker и Docker Compose на сервер.
2. Клонируйте репозиторий и перейдите в папку проекта:
   ```bash
   git clone <repo-url> qux
   cd qux
   ```
3. Создайте `.env` (см. раздел выше). Укажите внешние адреса БД/Redis при необходимости.
4. Запустите прод-стек:
   ```bash
   docker compose up -d --build
   ```
5. Проверьте логи:
   ```bash
   docker compose logs -f bot
   ```

### Вариант 2: без Docker

1. Установите Node.js **18+**, MongoDB и Redis.
2. Клонируйте репозиторий и перейдите в папку проекта.
3. Установите зависимости:
   ```bash
   npm ci --omit=dev
   ```
4. Создайте `.env` (см. раздел выше).
5. Запустите бота:
   ```bash
   npm start
   ```
6. (Опционально) Настройте процесс-менеджер (systemd/pm2) для автозапуска.

## Полезные команды

- Линт:
  ```bash
  npm run lint
  ```
- Форматирование:
  ```bash
  npm run format
  ```
