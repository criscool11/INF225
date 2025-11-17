const database = require('../db');

// Obtener todas las respuestas de estudiantes
const getRespuestas = (req, res) => {
  const query = 'SELECT * FROM respuestas_estudiantes';

  database.query(query, (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });
};

// Agregar una respuesta de estudiante
const addRespuesta = (req, res) => {
  const { estudiante_id, pregunta_id, respuesta_entregada } = req.body;
  const query = `
    INSERT INTO respuestas_estudiantes (estudiante_id, pregunta_id, respuesta_entregada)
    VALUES (?, ?, ?)
  `;
  const values = [estudiante_id, pregunta_id, respuesta_entregada];

  database.query(query, values, (err, result) => {
    if (err) throw err;
    const newRespuesta = { id: result.insertId, ...req.body };
    res.status(201).json(newRespuesta);
  });
};

// Actualizar una respuesta entregada
const updateRespuesta = (req, res) => {
  const respuestaId = req.params.id;
  const data = req.body;

  database.query(`SELECT * FROM respuestas_estudiantes WHERE id = ?`, [respuestaId], (err, result) => {
    if (err) throw err;
    const respuesta = result[0];
    if (!respuesta) return res.status(404).send('Respuesta no encontrada');

    const values = [
      data.estudiante_id || respuesta.estudiante_id,
      data.pregunta_id || respuesta.pregunta_id,
      data.respuesta_entregada || respuesta.respuesta_entregada,
      respuestaId
    ];

    const query = `
      UPDATE respuestas_estudiantes
      SET estudiante_id = ?, pregunta_id = ?, respuesta_entregada = ?
      WHERE id = ?
    `;

    database.query(query, values, (err) => {
      if (err) throw err;
      res.status(200).json({ id: respuestaId, ...data });
    });
  });
};

// Eliminar una respuesta
const deleteRespuesta = (req, res) => {
  const respuestaId = req.params.id;
  const query = `DELETE FROM respuestas_estudiantes WHERE id = ?`;

  database.query(query, [respuestaId], (err, result) => {
    if (err) throw err;
    if (result.affectedRows === 0) {
      res.status(404).send('Respuesta no encontrada');
    } else {
      res.status(200).send('Respuesta eliminada');
    }
  });
};

module.exports = {
  getRespuestas,
  addRespuesta,
  updateRespuesta,
  deleteRespuesta,
};
