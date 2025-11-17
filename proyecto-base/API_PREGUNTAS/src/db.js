const mysql = require('mysql2');

require('dotenv').config();

const database = mysql.createConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    charset: 'utf8mb4' // asegura codificación UTF-8 completa
});

// Forzar juego de caracteres en la sesión
try {
  database.query("SET NAMES utf8mb4");
  database.query("SET CHARACTER SET utf8mb4");
} catch (e) {
  // no-op en caso de fallo de inicio perezoso; la primera query efectiva aplicará el charset
}

module.exports = database;