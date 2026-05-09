// controllers/qwen.controller.js
const chatController = require('./qwen/chat.controller');
const mediaController = require('./qwen/media.controller');
const audioController = require('./qwen/audio.controller');
const multimodalController = require('./qwen/multimodal.controller');
const systemController = require('./qwen/system.controller');
const excelController = require('./qwen/excel.controller');
module.exports = {
    ...chatController,
    ...mediaController,
    ...audioController,
    ...multimodalController,
    ...systemController,
    ...excelController
};
