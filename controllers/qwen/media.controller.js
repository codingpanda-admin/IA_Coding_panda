// controllers/qwen/media.controller.js
const QwenService = require('../../services/qwen.service');
const asyncHandler = require('../../utils/asyncHandler.util');

exports.handleImageGeneration = asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
            success: false,
            error: 'El campo "prompt" es requerido para generar imagen'
        });
    }
    
    console.log(`[IMAGE] Generando imagen: ${prompt.substring(0, 50)}...`);
    const imageUrl = await QwenService.generateImage(prompt.trim());
    
    res.json({
        success: true,
        data: imageUrl,
        type: 'image'
    });
});

exports.handleVideoGeneration = asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    const fileName = req.file ? req.file.filename : null;
    
    if (!prompt && !fileName) {
        return res.status(400).json({
            success: false,
            error: 'Se requiere un prompt o una imagen para generar video'
        });
    }
    
    const mode = fileName ? 'Image-to-Video' : 'Text-to-Video';
    console.log(`[VIDEO] Modo: ${mode}, Prompt: ${prompt?.substring(0, 50) || 'N/A'}`);
    
    const videoUrl = await QwenService.generateVideo(prompt, fileName);
    
    res.json({
        success: true,
        data: videoUrl,
        type: 'video',
        mode: mode
    });
});