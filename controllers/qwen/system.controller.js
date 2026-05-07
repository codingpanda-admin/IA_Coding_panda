// controllers/qwen/system.controller.js
exports.healthCheck = (req, res) => {
    res.json({
        success: true,
        message: 'Qwen API Service is running',
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /api/qwen/chat - Chat con IA',
            'POST /api/qwen/generate-image - Generar imagen',
            'POST /api/qwen/generate-video - Generar video (T2V/I2V)',
            'POST /api/qwen/tts - Texto a voz',
            'POST /api/qwen/audio-stt - Audio a texto',
            'POST /api/qwen/multimodal - Análisis visual/documentos'
        ],
        supportedFormats: {
            images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
            documents: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'csv', 'json', 'epub', 'mobi', 'md']
        }
    });
};