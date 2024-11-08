const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database/app.db');

// Crear tabla de usuarios si no existe
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);
});

module.exports = db;