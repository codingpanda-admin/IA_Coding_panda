// controllers/database/system.controller.js
const DatabaseService = require('../../services/database.service');
const asyncHandler = require('../../utils/asyncHandler.util');

exports.getStatus = asyncHandler(async (req, res) => {
    const isConnected = DatabaseService.isDBConnected();
    if (!isConnected) {
        return res.json({ success: true, connected: false, message: 'Base de datos no conectada' });
    }
    const schema = await DatabaseService.getSchemaInfo();
    res.json({
        success: true,
        connected: true,
        tables: schema.map(t => t.table),
        tableCount: schema.length
    });
});

exports.getSchema = asyncHandler(async (req, res) => {
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    const schema = await DatabaseService.getSchemaInfo();
    res.json({ success: true, data: schema });
});

exports.getContext = asyncHandler(async (req, res) => {
    if (!DatabaseService.isDBConnected()) {
        return res.status(503).json({ success: false, error: 'Base de datos no conectada' });
    }
    const context = await DatabaseService.getContextData();
    res.json({ success: true, data: context });
});