// controllers/qwen/multimodal.controller.js
const QwenService = require('../../services/qwen.service');
const asyncHandler = require('../../utils/asyncHandler.util');

exports.handleMultimodal = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No se subió ningún archivo para analizar' });
    }
    
    const { prompt } = req.body;
    const defaultPrompt = 'Analiza y describe este contenido en detalle';
    const fileName = req.file.filename;
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const docExts = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.csv', '.json', '.epub', '.mobi', '.md'];
    
    console.log(`[MULTIMODAL] Archivo: ${fileName}, Extension: ${ext}`);
    
    let response;
    let analysisType;
    let documentContent = null;
    
    if (imageExts.includes(ext)) {
        analysisType = 'vision';
        response = await QwenService.chatVision(fileName, prompt || defaultPrompt);
    } else if (docExts.includes(ext)) {
        analysisType = 'document';
        const result = await QwenService.analyzeDocument(fileName, prompt || defaultPrompt);
        response = result.analysis;
        documentContent = result.extractedContent;
    } else {
        return res.status(400).json({
            success: false,
            error: `Formato no soportado: ${ext}. Formatos soportados: imagenes (${imageExts.join(', ')}) y documentos (${docExts.join(', ')})`
        });
    }
    
    res.json({
        success: true,
        data: response,
        type: 'text',
        analysisType,
        analyzedFile: fileName,
        documentContent
    });
});