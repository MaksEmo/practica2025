// 0. Инициализация БД при старте сервера (вызов init.js)
// гарантия того, что БД и таблица существуют.
require('../db/init.js'); // Путь относительно src/server.js

// 1. импорт модуля express
const express = require('express');
const path = require('path');

// 2. экземпляр приложения Express
const app = express();

// 3. Указываем Express, что нужно обслуживать статические файлы из папки 'public'
// Это значит, что файлы из '/public' будут доступны по корневому URL.
// Например, http://localhost:3000/index.html -> отдаст public/index.html
// http://localhost:3000/styles.css -> отдаст public/styles.css
app.use(express.static('public'));

// Парсит тело application/x-www-form-urlencoded (обычная HTML-форма)
app.use(express.urlencoded({ extended: true }));
// Парсит тело application/json (если вдруг фронт будет отправлять JSON)
app.use(express.json());

// --- Роут для обработки отправки формы ---
// Ожидаем POST-запрос на /submit
app.post('/submit', (req, res) => {
    console.log("Получен POST-запрос на /submit");
    console.log("Тело запроса (данные формы):", req.body);

    // Или перенаправить на страницу "Спасибо"
    res.redirect('/thank-you'); // Перенаправление на страницу благодарности
});

// --- Новые роуты для страниц ---
// Роут для страницы "Форматы"
app.get('/formats', (req, res) => {
  // path.join корректно объединяет пути под разные ОС
  res.sendFile(path.join(__dirname, '../public/formats.html'));
});

// Роут для страницы "Контакты"
app.get('/contacts', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contacts.html'));
});

// Роут для страницы "Главная" (корневой путь)
app.get('/home', (req, res) => {
res.sendFile(path.join(__dirname, '../public/index.html'));});

// Роут для страницы "Как это работает"
app.get('/how-it-works', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/how-it-works.html'));
});

// Роут для страницы "Кейсы"
app.get('/cases', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cases.html'));
});

// Роут для страницы "Отзывы"
app.get('/reviews', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reviews.html'));
});

// Роут для страницы "FAQ"
app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/faq.html'));
});


// 4. порт сервера
const PORT = process.env.PORT || 3000;

// Импортируем better-sqlite3 и path (если ещё не импортировал в начале файла)
const Database = require('better-sqlite3');

// Путь к БД (такой же, как в init.js)
const dbPath = path.resolve(__dirname, '../db/database.sqlite');

// --- Роут для обработки отправки формы ---
app.post('/submit', (req, res) => {
    console.log("Получен POST-запрос на /submit");
    console.log("Тело запроса (данные формы):", req.body);

    // --- 1. Серверная валидация ---
    let errors = [];

    const { name, phone } = req.body; // Извлекаем name и phone из тела запроса

    // Проверяем обязательное поле 'name'
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Имя обязательно для заполнения.');
    }

    // Проверяем обязательное поле 'phone'
    // Простая проверка: длина > 5 символов и содержит только цифры, плюсы, скобки, тире, пробелы
    // В реальности паттерн может быть сложнее
    const phoneRegex = /^[\d\s\-\+\(\)]{5,}$/;
    if (!phone || typeof phone !== 'string' || !phoneRegex.test(phone)) {
        errors.push('Некорректный формат телефона.');
    }

    // Если есть ошибки валидации, отправляем их клиенту
    if (errors.length > 0) {
        console.log("Ошибки валидации:", errors);
        // Возвращаем JSON с ошибками и статусом 400 (Bad Request)
        return res.status(400).json({ success: false, errors: errors });
    }

    // Если валидация прошла успешно, name и phone теперь можно использовать

    // --- 2. Запись данных в SQLite ---
    try {
        // Подключаемся к БД (можно открыть/закрыть соединение для каждого запроса в MVP)
        const db = new Database(dbPath);

        // Подготавливаем SQL-запрос для вставки данных
        // Используем подготовленные выражения (prepared statements) для безопасности
        const stmt = db.prepare(`
            INSERT INTO applications (name, phone, email, format, date, message)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        // Выполняем запрос, передавая значения параметров
        // req.body может содержать undefined, если поле не было отправлено, это нормально для SQLite
        const info = stmt.run(
            name.trim(), // name
            phone.trim(), // phone
            req.body.email || null, // email (если нет, то null)
            req.body.format || null, // format (если нет, то null)
            req.body.date || null, // date (если нет, то null)
            req.body.message || null // message (если нет, то null)
        );

        console.log(`Данные успешно записаны в БД. ID новой записи: ${info.lastInsertRowid}`);

        // Закрываем соединение с БД
        db.close();

                // --- 4. Запись в лог-файл (fallback) ---
        const fs = require('fs'); // Импортируем модуль fs для работы с файлами
        const path = require('path'); // Уже должен быть импортирован

        // Путь к лог-файлу (лучше положить в папку logs)
        const logFilePath = path.resolve(__dirname, '../logs/application_logs.txt');

        // Формируем строку для лога
        const logEntry = `${new Date().toISOString()} - Application Received - Name: ${name}, Phone: ${phone}\n`;

        try {
            // Добавляем запись в конец файла
            fs.appendFileSync(logFilePath, logEntry);
            console.log(`Заявка записана в лог: ${logEntry.trim()}`);
        } catch (logErr) {
            // Обрабатываем ошибку записи в лог 
            console.error("Ошибка при записи в лог-файл:", logErr);
        }

        // --- 3. Отправка успешного ответа (переносим сюда) ---
        // Перенаправляем на страницу "Спасибо" после успешной записи в БД и лог
        res.redirect('/thank-you');

    } catch (err) {
        // Обрабатываем ошибки при работе с БД
        console.error("Ошибка при записи в БД:", err);
        // Возвращаем JSON с ошибкой сервера и статусом 500
        res.status(500).json({ success: false, errors: ['Ошибка сервера при сохранении заявки.'] });
    }
});
// --- Конец роута /submit ---

// 5. Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Он будет отдавать файлы из папки 'public'.`);
    console.log(`Откройте в браузере: http://localhost:${PORT}`);
});

