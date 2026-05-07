// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');

// Importar utilidades y middlewares
const initializeDirectories = require('./utils/directory.init');
const corsMiddleware = require('./middlewares/cors.middleware');
const requestLogger = require('./middlewares/logger.middleware');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler.middleware');

// Importar rutas y servicios
const qwenRoutes = require('./routes/qwen.routes');
const DatabaseService = require('./services/database.service');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar carpetas necesarias
initializeDirectories(__dirname);

// Middlewares globales
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/qwen', qwenRoutes);

app.get('/', (req, res) => {
    res.json({
        name: 'Qwen AI API',
        version: '1.0.0',
        status: 'running',
        uploads: '/uploads/*'
    });
});

// Manejadores de errores
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Iniciar servidor
const startServer = async () => {
    try {
        await DatabaseService.initialize();
        console.log('[INIT] Base de datos MySQL conectada y tablas verificadas');
    } catch (dbError) {
        console.warn(`[INIT] Advertencia: No se pudo conectar a MySQL: ${dbError.message}`);
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n========================================`);
        console.log(`Servidor corriendo en: http://localhost:${PORT}`);
        console.log(`Base de datos: ${DatabaseService.isDBConnected() ? 'Conectada' : 'No conectada'}`);
        console.log(`========================================\n`);
    });
};

startServer();