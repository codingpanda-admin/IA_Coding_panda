// controllers/database/quote.controller.js
const DatabaseService = require('../../services/database.service');
const asyncHandler = require('../../utils/asyncHandler.util');

exports.cotizarAuto = asyncHandler(async (req, res) => {
    const { marca, modelo, anio, valor, tipoCobertura, zonaId } = req.body;
    
    if (!marca || !modelo || !anio) {
        return res.status(400).json({ success: false, error: 'Se requiere marca, modelo y año del vehículo' });
    }
    
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    
    const cotizacion = await DatabaseService.generarCotizacionAuto({
        marca,
        modelo,
        anio: parseInt(anio),
        valor: parseFloat(valor) || null,
        tipoCobertura,
        zonaId: parseInt(zonaId) || 1
    });
    
    res.json({ success: true, data: cotizacion });
});

exports.getCotizaciones = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    const cotizaciones = await DatabaseService.query(`
        SELECT c.*, ts.nombre as tipo_seguro_nombre
        FROM cotizaciones c
        JOIN tipos_seguros ts ON c.tipo_seguro_id = ts.id
        ORDER BY c.created_at DESC
        LIMIT ?
    `, [limit]);
    
    res.json({ success: true, data: cotizaciones });
});