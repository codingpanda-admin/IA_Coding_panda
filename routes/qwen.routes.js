// routes/qwen.routes.js
const express = require('express');
const router = express.Router();
const qwenController = require('../controllers/qwen.controller');
const { upload, handleMulterError } = require('../middlewares/upload.middleware');

// ==========================================
// Endpoints de Inteligencia Artificial (Qwen)
// ==========================================

router.get('/health', qwenController.healthCheck);

router.post('/chat', qwenController.handleChat);

router.post('/generate-image', qwenController.handleImageGeneration);

router.post('/generate-video', 
    upload.single('file'), 
    handleMulterError,
    qwenController.handleVideoGeneration
);

router.post('/tts', qwenController.handleTextToSpeech);

router.post('/audio-stt', 
    upload.single('file'), 
    handleMulterError,
    qwenController.handleAudioToText
);

router.post('/multimodal', 
    upload.single('file'), 
    handleMulterError,
    qwenController.handleMultimodal
);
router.post(
  '/upload-excel',
  upload.single('file'),
  handleMulterError,
  qwenController.handleExcelUpload
);
module.exports = router;