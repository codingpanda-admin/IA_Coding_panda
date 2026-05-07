// routes/db.routes.js
const express = require('express');
const router = express.Router();
const dbController = require('../controllers/database.controller');

// Endpoints de Base de Datos
router.get('/status', dbController.getStatus);
router.get('/schema', dbController.getSchema);
router.get('/context', dbController.getContext);
router.post('/query', dbController.executeQuery);
router.post('/cotizar/auto', dbController.cotizarAuto);
router.get('/tipos-seguros', dbController.getTiposSeguros);
router.get('/coberturas/:tipoSeguroId', dbController.getCoberturas);
router.get('/marcas', dbController.getMarcas);
router.get('/zonas', dbController.getZonas);
router.get('/cotizaciones', dbController.getCotizaciones);

module.exports = router;