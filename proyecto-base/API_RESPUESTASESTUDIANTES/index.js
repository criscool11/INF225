const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const {
  DB_HOST = 'mysql_respuestas',
  DB_PORT = '3306',
  DB_NAME = 'BD06_RESPUESTASESTUDIANTES',
  DB_USER = 'root',
  DB_PASSWORD = 'password',
  PORT_API = '8081'
} = process.env;

let pool;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function initPoolWithRetry(retries = 20, delayMs = 1500) {
  for (let i = 1; i <= retries; i++) {
    try {
      pool = await mysql.createPool({
        host: DB_HOST,
        port: Number(DB_PORT),
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        timezone: 'Z'
      });
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      console.log('Conectado a MySQL:', DB_HOST, DB_NAME);
      return;
    } catch (err) {
      console.error(`Intento ${i}/${retries} conexión MySQL falló:`, err.code || err.message);
      await wait(delayMs);
    }
  }
  throw new Error('No se pudo conectar a MySQL después de varios intentos');
}

initPoolWithRetry()
  .then(() => {
    app.listen(Number(PORT_API), () => {
      console.log(`API respuestas escuchando en :${PORT_API}`);
    });
  })
  .catch((err) => {
    console.error('Error iniciando API:', err);
    process.exit(1);
  });

/* -------------------- RUTAS -------------------- */

// Health básico
app.get('/api/health', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    res.json({ ok: true, service: 'api_respuestasestudiantes', db: 'up' });
  } catch {
    res.status(500).json({ ok: false, service: 'api_respuestasestudiantes', db: 'down' });
  }
});

app.post('/api/respuestas', async (req, res) => {
  try {
    const { username, ensayoId, fechaIso, respuestas } = req.body || {};
    if (!username || !ensayoId || !fechaIso || !respuestas) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        'SELECT id FROM respuestas_alumno WHERE username = ? AND ensayo_id = ?',
        [username, ensayoId]
      );

      if (rows.length) {
        await conn.query(
          'UPDATE respuestas_alumno SET fecha_iso = ?, respuestas_json = ? WHERE username = ? AND ensayo_id = ?',
          [fechaIso, JSON.stringify(respuestas), username, ensayoId]
        );
      } else {
        await conn.query(
          'INSERT INTO respuestas_alumno (username, ensayo_id, fecha_iso, respuestas_json) VALUES (?, ?, ?, ?)',
          [username, ensayoId, fechaIso, JSON.stringify(respuestas)]
        );
      }

      res.json({ ok: true });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al guardar respuestas' });
  }
});

app.get('/api/respuestas', async (req, res) => {
  try {
    const { username, ensayoId } = req.query;
    if (!username) return res.status(400).json({ error: 'username es requerido' });

    const conn = await pool.getConnection();
    try {
      if (ensayoId) {
        const [rows] = await conn.query(
          `SELECT username, ensayo_id AS ensayoId, fecha_iso AS fechaIso, respuestas_json AS respuestas
           FROM respuestas_alumno
           WHERE username = ? AND ensayo_id = ?`,
          [username, ensayoId]
        );
        if (!rows.length) return res.json(null);
        const row = rows[0];
        if (typeof row.respuestas === 'string') {
          try { row.respuestas = JSON.parse(row.respuestas); } catch {}
        }
        return res.json(row);
      } else {
        const [rows] = await conn.query(
          `SELECT username, ensayo_id AS ensayoId, fecha_iso AS fechaIso
           FROM respuestas_alumno
           WHERE username = ?
           ORDER BY id DESC`,
          [username]
        );
        return res.json(rows);
      }
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al consultar respuestas' });
  }
});


app.get('/api/respuestas/all', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT username, ensayo_id AS ensayoId, fecha_iso AS fechaIso, respuestas_json AS respuestas
         FROM respuestas_alumno
         ORDER BY id DESC`
      );
      for (const row of rows) {
        if (typeof row.respuestas === 'string') {
          try { row.respuestas = JSON.parse(row.respuestas); } catch {}
        }
      }
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar respuestas' });
  }
});


app.get('/api/respuestas/usuarios', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT DISTINCT username FROM respuestas_alumno ORDER BY username ASC`
      );
      res.json(rows.map(r => r.username));
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

app.get('/api/respuestas/all', async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT username, ensayo_id AS ensayoId, fecha_iso AS fechaIso,
                respuestas_json AS respuestas, ensayo_json AS ensayo
         FROM respuestas_alumno
         ORDER BY id DESC`
      );
      for (const row of rows) {
        if (typeof row.respuestas === 'string') { try { row.respuestas = JSON.parse(row.respuestas); } catch {} }
        if (typeof row.ensayo === 'string') { try { row.ensayo = JSON.parse(row.ensayo); } catch {} }
      }
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar respuestas' });
  }
});