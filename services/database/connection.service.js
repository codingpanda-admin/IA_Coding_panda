// services/database/connection.service.js
const mysql = require('mysql2/promise');

const state = {
    pool: null,
    isConnected: false
};

const connect = async () => {
    if (state.pool) return state.pool;

    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'qwen_user',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'Qwen-IA',
        port: parseInt(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    };

    try {
        console.log(`[DB] Conectando a MySQL: ${config.host}:${config.port}/${config.database}`);
        state.pool = mysql.createPool(config);
        
        const connection = await state.pool.getConnection();
        console.log(`[DB] Conexión exitosa a MySQL`);
        connection.release();
        
        state.isConnected = true;
        return state.pool;
    } catch (error) {
        console.error(`[DB ERROR] Error conectando a MySQL: ${error.message}`);
        state.isConnected = false;
        throw error;
    }
};

const getPool = () => state.pool;

const isDBConnected = () => state.isConnected;

const query = async (sql, params = []) => {
    if (!state.pool) await connect();
    
    try {
        const [results] = await state.pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error(`[DB ERROR] Query failed: ${error.message}`);
        console.error(`[DB ERROR] SQL: ${sql.substring(0, 200)}`);
        throw error;
    }
};

const close = async () => {
    if (state.pool) {
        await state.pool.end();
        state.pool = null;
        state.isConnected = false;
        console.log(`[DB] Conexión cerrada`);
    }
};

module.exports = { connect, getPool, isDBConnected, query, close };