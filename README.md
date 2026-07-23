# Dental Admin — MVP (Фаза 1)

Реалізація Фази 1 з `Dental_Clinic_CRM_Specification_v2.md`: backend + rule
engine, Telegram-бот, admin-панель. Веб-віджет бронювання для пацієнтів і
WhatsApp/voice — наступні кроки (Фаза 1 продовження / Фаза 3).

## Структура

```
backend/       Fastify + Prisma + PostgreSQL API (ядро: пацієнти, типи візитів,
                правила розкладу, винятки, записи, лист очікування)
telegram-bot/  Telegraf-бот для пацієнтів (CZ/UA), викликає backend API
admin-web/     React-адмінка для лікаря/асистента (календар, шаблони, записи)
```

## Запуск локально

### 1. База даних

Локально (без Docker):

```bash
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE USER dental WITH PASSWORD 'dental' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE dental_admin OWNER dental;"
```

Або через Docker: `docker compose up -d postgres` (потребує робочого Docker
daemon).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed        # заповнює приклад правил лікаря з ТЗ
npm run dev               # http://localhost:3000
```

### 3. Telegram-бот

```bash
cd telegram-bot
cp .env.example .env      # вписати BOT_TOKEN від @BotFather і STAFF_CHAT_ID асистентки
npm install
npm run dev
```

### 4. Admin-панель

```bash
cd admin-web
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

## Що вже реально працює (перевірено end-to-end)

* **Rule Engine**: тижневі шаблони (`SlotTemplate`) генерують конкретні слоти;
  ручне закриття (`SlotException`) і вже існуючі записи (`Appointment`)
  коректно віднімаються. Seed відтворює точний приклад лікаря: чт 07:00–09:00
  тільки "Akutní bolest", пт 08:00–10:00 "Zákrok", вт/ст/чт 16:00–17:00
  "Preventivní prohlídka".
* **Захист від подвійного бронювання**: створення запису йде в транзакції з
  serializable isolation і повторною перевіркою вільного слоту.
* **Telegram-бот**: вибір мови (CZ/UA), реєстрація пацієнта зі згодою на
  обробку даних, бронювання за типом візиту, окрема гілка "Гострий біль"
  (питання → пошук найближчого акутного слоту → якщо немає, заявка
  `NEEDS_CALL` + push-повідомлення асистентці в Telegram), перегляд/скасування
  своїх записів.
* **Admin-панель**: тижневий календар з кольорами статусів і вільними
  слотами, закриття слоту в один клік, конструктор шаблонів розкладу,
  список записів з фільтрами за статусом/типом/датою.

## Свідомо не входить у цей інкремент (наступні кроки)

* Веб-віджет бронювання для пацієнтів (без Telegram) — використовує ті самі
  backend-ендпоінти, додається окремим невеликим кроком.
* Автонагадування 24h/2h і "живий" лист очікування (модель `WaitlistEntry`
  вже є в API, автоматичного опитування пацієнтів ще немає).
* LLM-класифікація вільного тексту (зараз тріаж гострого болю — одне вільне
  повідомлення, яке зберігається як є; природномовна "розмова" з уточненнями
  — Фаза 2 з окремого ТЗ).
* WhatsApp Business API, SMS, voice-автовідповідач — Фаза 3, за бюджетом і
  результатами використання перших двох фаз.
* Авторизація в admin-панелі (зараз API відкритий без токена — обов'язково
  додати перед реальним запуском, ordinace матиме доступ в мережу).
* Синхронізація з існуючим календарем лікаря (чекаємо деталей, які лікар
  дасть окремо).
