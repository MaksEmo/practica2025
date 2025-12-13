// 1. Импортируем драйвер better-sqlite3
const Database = require('better-sqlite3');
const path = require('path'); // Модуль для работы с путями файлов

// 2. Относительный путь к файлу базы данных (он будет создан в папке db)
const dbPath = path.resolve(__dirname, 'database.sqlite');

// 3. Подключаемся к базе данных (создаст файл, если его нет)
const db = new Database(dbPath);

console.log('Подключение к SQLite установлено.');

// 4. SQL-запрос для создания таблицы applications (если она не существует)
//    Колонки соответствуют полям формы (name, phone, email, format, date, message, timestamp)
const createTableSQL = `
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        format TEXT,
        date TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`;

// 5. Выполняем запрос на создание таблицы
db.exec(createTableSQL);

console.log('Таблица applications проверена/создана.');

// 6. Закрываем соединение с базой данных
db.close();

console.log('Соединение с SQLite закрыто.');
console.log(`Файл базы данных находится по пути: ${dbPath}`);

// Экспортируем путь к БД, если понадобится в других файлах
// module.exports = dbPath;