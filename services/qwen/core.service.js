// services/qwen/core.service.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const URL_COMPATIBLE = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const URL_AIGC = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc';
const URL_AIGC_INTL = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc';

const getHeaders = (isAsync = false) => {
    const rawApiKey = process.env.DASHSCOPE_API_KEY || '';
    const cleanKey = rawApiKey.replace(/['"]/g, '').trim();
    if (!cleanKey) throw new Error('DASHSCOPE_API_KEY no está configurada');
    
    const headers = {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
    };
    if (isAsync) headers['X-DashScope-Async'] = 'enable';
    return headers;
};

const getPublicUrl = (fileName, subDir = '') => {
    const baseUrl = (process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
    const filePath = subDir ? `uploads/${subDir}/${fileName}` : `uploads/${fileName}`;
    return `${baseUrl}/${filePath}`;
};

const downloadAndSaveFile = async (url, fileName, subDir = 'generated') => {
    try {
        const targetDir = path.join(process.cwd(), 'uploads', subDir);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        
        const filePath = path.join(targetDir, fileName);
        const response = await axios({ method: 'GET', url, responseType: 'stream', timeout: 120000 });
        
        const writer = fs.createWriteStream(filePath);
        await pipeline(response.data, writer);
        return getPublicUrl(fileName, subDir);
    } catch (error) {
        console.error(`[DOWNLOAD ERROR] ${error.message}`);
        return url;
    }
};

module.exports = { URL_COMPATIBLE, URL_AIGC, URL_AIGC_INTL, getHeaders, getPublicUrl, downloadAndSaveFile };