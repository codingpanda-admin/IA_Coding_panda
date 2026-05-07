// controllers/database/catalog.controller.js
const DatabaseService = require('../../services/database.service');
const asyncHandler = require('../../utils/asyncHandler.util');

exports.getTiposSeguros = asyncHandler(async (req, res) => {
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    const tipos = await DatabaseService.query('SELECT * FROM tipos_seguros WHERE activo = TRUE');
    res.json({ success: true, data: tipos });
});

exports.getCoberturas = asyncHandler(async (req, res) => {
    const { tipoSeguroId } = req.params;
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    const coberturas = await DatabaseService.query(
        'SELECT * FROM coberturas WHERE tipo_seguro_id = ? AND activo = TRUE',
        [tipoSeguroId]
    );
    res.json({ success: true, data: coberturas });
});

exports.getMarcas = asyncHandler(async (req, res) => {
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    const marcas = await DatabaseService.query('SELECT * FROM marcas_vehiculos WHERE activo = TRUE ORDER BY nombre');
    res.json({ success: true, data: marcas });
});

exports.getZonas = asyncHandler(async (req, res) => {
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    const zonas = await DatabaseService.query('SELECT * FROM zonas WHERE activo = TRUE');
    res.json({ success: true, data: zonas });
});