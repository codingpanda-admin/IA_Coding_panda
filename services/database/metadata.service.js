// services/database/metadata.service.js
const { query } = require('./connection.service');

const getSchemaInfo = async () => {
    try {
        const tables = await query(
            `SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`, 
            [process.env.DB_NAME || 'Qwen-IA']
        );
        
        const schemaInfo = [];
        for (const table of tables) {
            const columns = await query(
                `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, 
                [process.env.DB_NAME || 'Qwen-IA', table.TABLE_NAME]
            );
            
            schemaInfo.push({
                table: table.TABLE_NAME,
                comment: table.TABLE_COMMENT,
                columns: columns.map(c => ({
                    name: c.COLUMN_NAME,
                    type: c.DATA_TYPE,
                    nullable: c.IS_NULLABLE === 'YES',
                    key: c.COLUMN_KEY
                }))
            });
        }
        return schemaInfo;
    } catch (error) {
        console.error(`[DB ERROR] Error obteniendo schema: ${error.message}`);
        return [];
    }
};

const getContextData = async () => {
    try {
        const context = {};
        context.tiposSeguros = await query('SELECT * FROM tipos_seguros WHERE activo = TRUE');
        context.coberturas = await query(`SELECT c.*, ts.nombre as tipo_seguro_nombre FROM coberturas c JOIN tipos_seguros ts ON c.tipo_seguro_id = ts.id WHERE c.activo = TRUE`);
        context.tarifas = await query(`SELECT t.*, ts.nombre as tipo_seguro_nombre FROM tarifas t JOIN tipos_seguros ts ON t.tipo_seguro_id = ts.id WHERE t.activo = TRUE`);
        context.zonas = await query('SELECT * FROM zonas WHERE activo = TRUE');
        context.marcas = await query('SELECT * FROM marcas_vehiculos WHERE activo = TRUE');
        
        const config = await query('SELECT clave, valor FROM configuracion');
        context.configuracion = {};
        config.forEach(c => context.configuracion[c.clave] = c.valor);
        
        return context;
    } catch (error) {
        console.error(`[DB ERROR] Error obteniendo contexto: ${error.message}`);
        return null;
    }
};

module.exports = { getSchemaInfo, getContextData };