const express = require('express');
const router = new express.Router();

const respuestasController = require('../controllers/index');

// CRUD REST de respuestas
router.get('/api/respuestas', respuestasController.getRespuestas);
router.post('/api/respuestas', respuestasController.addRespuesta);
router.put('/api/respuestas/:id', respuestasController.updateRespuesta);
router.delete('/api/respuestas/:id', respuestasController.deleteRespuesta);

module.exports = router;
