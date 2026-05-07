// services/database.service.js
const connection = require('./database/connection.service');
const init = require('./database/init.service');
const metadata = require('./database/metadata.service');
const queryService = require('./database/query.service');
const quoteService = require('./database/quote.service');

class DatabaseService {
    static get pool() { return connection.getPool(); }
    
    static async initialize() {
        await connection.connect();
        await init.createTables();
        return connection.getPool();
    }
    
    static isDBConnected() { return connection.isDBConnected(); }
    static async query(sql, params) { return connection.query(sql, params); }
    static async close() { return connection.close(); }
    
    // Schema & Init
    static createTables = init.createTables;
    static insertInitialData = init.insertInitialData;
    
    // Metadata & AI Context
    static getSchemaInfo = metadata.getSchemaInfo;
    static getContextData = metadata.getContextData;
    
    // Security & Business
    static safeQuery = queryService.safeQuery;
    static generarCotizacionAuto = quoteService.generarCotizacionAuto;
}

module.exports = DatabaseService;