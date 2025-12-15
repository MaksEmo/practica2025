// --- src/server.js ---

// Импортируем модули
const express = require('express');
const path = require('path');
const cors = require('cors'); // Импортируем cors
const Database = require('better-sqlite3'); // Импортируем better-sqlite3

// Создаём экземпляр приложения
const app = express();

// Middleware: CORS
app.use(cors());

// Middleware: Парсинг тела application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// Middleware: Парсинг тела application/json
app.use(express.json());

// Middleware: Отдача статических файлов из папки 'public'
app.use(express.static('public'));

// Middleware: Отдача статических файлов из папки 'node_modules' (библиотеки)
app.use('/node_modules', express.static('node_modules'));

// --- Инициализация БД ---
// Вызов init.js для создания БД и таблицы (если не существует)
require('../db/init.js'); // Вызываем init.js при старте сервера

// --- Роуты для страниц ---
// Роут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Роут для страницы "Форматы"
app.get('/formats', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/formats.html'));
});

// Роут для страницы "Контакты"
app.get('/contacts', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/contacts.html'));
});

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

// Роут для страницы "Спасибо"
app.get('/thank-you', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/thank-you.html'));
});

// Роут для страницы "Оставить заявку"
app.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/order.html'));
});

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
        // Путь к БД (относительно src/server.js -> ../db/database.sqlite)
        const dbPath = path.resolve(__dirname, '../db/database.sqlite');
        const db = new Database(dbPath);

        // Подготавливаем SQL-запрос для вставки данных
        const stmt = db.prepare(`
            INSERT INTO applications (name, phone, email, format, date, message)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        // Выполняем запрос, передавая значения параметров
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

        // --- 3. Запись в лог-файл (fallback) ---
        const fs = require('fs'); // Импортируем fs для логирования
        // Путь к лог-файлу (относительно src/server.js -> ../logs/application_logs.txt)
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
            // Важно: даже если лог не записался, основная функция (запись в БД) уже выполнена.
            // Для MVP часто считают успехом и просто логгируем ошибку лога.
        }

        // --- 4. Отправка успешного ответа ---
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

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Он будет отдавать файлы из папок 'public' и 'node_modules'.`);
    console.log(`Откройте в браузере: http://localhost:${PORT}`);
});

// Экспортируем app (если нужно для тестов)
// module.exports = app;