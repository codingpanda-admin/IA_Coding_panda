// controllers/qwen/audio.controller.js
const QwenService = require('../../services/qwen.service');
const asyncHandler = require('../../utils/asyncHandler.util');

exports.handleTextToSpeech = asyncHandler(async (req, res) => {
    const { prompt, text } = req.body;
    const inputText = text || prompt;
    
    if (!inputText || typeof inputText !== 'string' || !inputText.trim()) {
        return res.status(400).json({
            success: false,
            error: 'El texto es requerido para convertir a voz'
        });
    }
    
    console.log(`[TTS] Texto: ${inputText.substring(0, 50)}...`);
    const audioUrl = await QwenService.textToSpeech(inputText.trim());
    
    res.json({
        success: true,
        data: audioUrl,
        type: 'audio'
    });
});

exports.handleAudioToText = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No se subió ningún archivo de audio'
        });
    }
    
    const { prompt } = req.body;
    console.log(`[STT] Archivo: ${req.file.filename}`);
    
    const transcription = await QwenService.audioToText(req.file.filename, prompt);
    
    res.json({
        success: true,
        data: transcription,
        type: 'text',
        originalFile: req.file.filename
    });
});