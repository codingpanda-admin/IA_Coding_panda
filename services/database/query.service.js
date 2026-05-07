const { query } = require('./connection.service');

const safeQuery = async (sql) => {
    const normalizedSQL = sql.trim().toUpperCase();
    if (!normalizedSQL.startsWith('SELECT')) {
        throw new Error('Solo se permiten consultas SELECT por seguridad');
    }
    
    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE'];
    for (const word of forbidden) {
        if (normalizedSQL.includes(word)) {
            throw new Error(`Operación ${word} no permitida`);
        }
    }
    return await query(sql);
};

module.exports = { safeQuery };