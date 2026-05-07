// controllers/qwen/chat.controller.js
const QwenService = require('../../services/qwen.service');
const asyncHandler = require('../../utils/asyncHandler.util');

exports.handleChat = asyncHandler(async (req, res) => {
    const { 
        prompt, 
        enableThinking = true, 
        conversationHistory = [], 
        documentContext = null 
    } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
            success: false,
            error: 'El campo "prompt" es requerido y debe ser texto'
        });
    }
    
    console.log(`[CHAT] Prompt: ${prompt.substring(0, 50)}...`);
    console.log(`[CHAT] Historia: ${conversationHistory.length} mensajes`);
    if (documentContext) {
        console.log(`[CHAT] Documento en contexto: ${documentContext.fileName}`);
    }
    
    const response = await QwenService.chat(
        prompt.trim(), 
        enableThinking, 
        conversationHistory,
        documentContext
    );
    
    res.json({
        success: true,
        data: response,
        type: 'text'
    });
});