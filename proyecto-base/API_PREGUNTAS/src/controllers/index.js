const database = require('../db');

const getPreguntas = (req, res) => {
  const query = 'SELECT * FROM preguntas';

  database.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
};

const addPregunta = (req, res) => {
  const { enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, respuesta_correcta, tema, es_libre } = req.body;
  const query = `
    INSERT INTO preguntas (enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, respuesta_correcta, tema, es_libre)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    respuesta_correcta,
    tema || null,
    typeof es_libre === 'boolean' ? (es_libre ? 1 : 0) : 0,
  ];

  database.query(query, values, (err, result) => {
    if (err) throw err;
    const newPregunta = { id: result.insertId, ...req.body };
    res.status(201).json(newPregunta);
  });
};

const updatePregunta = (req, res) => {
  const preguntaId = req.params.id;
  const data = req.body;

  database.query(`SELECT * FROM preguntas WHERE id = ?`, [preguntaId], (err, result) => {
    if (err) throw err;
    const pregunta = result[0];
    if (!pregunta) return res.status(404).send('Pregunta no encontrada');

    const values = [
      data.enunciado ?? pregunta.enunciado,
      data.alternativa_a ?? pregunta.alternativa_a,
      data.alternativa_b ?? pregunta.alternativa_b,
      data.alternativa_c ?? pregunta.alternativa_c,
      data.alternativa_d ?? pregunta.alternativa_d,
      data.respuesta_correcta ?? pregunta.respuesta_correcta,
      data.tema ?? pregunta.tema,
      typeof data.es_libre === 'boolean' ? (data.es_libre ? 1 : 0) : pregunta.es_libre,
      preguntaId,
    ];

    const query = `
      UPDATE preguntas 
      SET enunciado = ?, alternativa_a = ?, alternativa_b = ?, alternativa_c = ?, alternativa_d = ?, respuesta_correcta = ?, tema = ?, es_libre = ?
      WHERE id = ?
    `;

    database.query(query, values, (err) => {
      if (err) throw err;
      res.status(200).json({ id: preguntaId, ...data });
    });
  });
};

const deletePregunta = (req, res) => {
  const preguntaId = req.params.id;
  const query = `DELETE FROM preguntas WHERE id = ?`;

  database.query(query, [preguntaId], (err, result) => {
    if (err) throw err;
    if (result.affectedRows === 0) {
      res.status(404).send('Pregunta no encontrada');
    } else {
      res.status(200).send('Pregunta eliminada');
    }
  });
};

module.exports = {
  getPreguntas,
  addPregunta,
  updatePregunta,
  deletePregunta,
};
