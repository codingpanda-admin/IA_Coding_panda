// controllers/database/query.controller.js
const DatabaseService = require('../../services/database.service');
const asyncHandler = require('../../utils/asyncHandler.util');

exports.executeQuery = asyncHandler(async (req, res) => {
    const { sql } = req.body;
    
    if (!sql) {
        return res.status(400).json({ success: false, error: 'El campo "sql" es requerido' });
    }
    
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    
    const results = await DatabaseService.safeQuery(sql);
    res.json({
        success: true,
        data: results,
        rowCount: results.length
    });
});