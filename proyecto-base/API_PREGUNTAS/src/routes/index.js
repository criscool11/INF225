const express = require('express');
const router = new express.Router();

const preguntasController = require('../controllers/index');

// CRUD REST de preguntas
router.get('/api/preguntas', preguntasController.getPreguntas);
router.post('/api/preguntas', preguntasController.addPregunta);
router.put('/api/preguntas/:id', preguntasController.updatePregunta);
router.delete('/api/preguntas/:id', preguntasController.deletePregunta);

module.exports = router;
