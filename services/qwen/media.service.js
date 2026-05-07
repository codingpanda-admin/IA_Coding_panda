// services/qwen/media.service.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { URL_AIGC, URL_AIGC_INTL, getHeaders, getPublicUrl, downloadAndSaveFile } = require('./core.service');

const pollTask = async (taskId, isImage = false) => {
    let attempts = 0;
    const maxAttempts = isImage ? 40 : 60;
    const waitTime = isImage ? 3000 : 10000;
    
    while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, waitTime));
        attempts++;
        
        const checkRes = await axios.get(`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`, { headers: getHeaders(), timeout: 30000 });
        const status = checkRes.data?.output?.task_status;
        
        if (status === 'SUCCEEDED') return checkRes.data;
        if (status === 'FAILED') throw new Error(`Tarea fallida: ${checkRes.data?.output?.message || 'Error desconocido'}`);
    }
    throw new Error('Timeout: La generación tardó demasiado');
};

const generateImageAsync = async (prompt) => {
    const payload = {
        model: "wan2.6-t2i",
        input: { messages: [{ role: "user", content: [{ text: prompt }] }] },
        parameters: { size: "1280*1280", n: 1, prompt_extend: true, watermark: false }
    };

    const createRes = await axios.post(`${URL_AIGC_INTL}/image-generation/generation`, payload, { headers: getHeaders(true), timeout: 30000 });
    const taskId = createRes.data?.output?.task_id;
    if (!taskId) throw new Error('No se pudo crear la tarea de imagen async');
    
    const taskData = await pollTask(taskId, true);
    let imageUrl = taskData?.output?.choices?.[0]?.message?.content?.[0]?.image || taskData?.output?.results?.[0]?.url;
    
    if (imageUrl.startsWith('data:')) {
        const localFileName = `image_${Date.now()}.png`;
        const filePath = path.join(process.cwd(), 'uploads', 'images', localFileName);
        fs.writeFileSync(filePath, Buffer.from(imageUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
        return getPublicUrl(localFileName, 'images');
    }
    return await downloadAndSaveFile(imageUrl, `image_${Date.now()}.png`, 'images');
};

const generateImage = async (prompt) => {
    if (!prompt) throw new Error('El prompt es requerido para generar imagen');
    
    try {
        const payload = {
            model: "wan2.6-t2i",
            input: { messages: [{ role: "user", content: [{ text: prompt }] }] },
            parameters: { size: "1280*1280", n: 1, prompt_extend: true, watermark: false }
        };
        const syncRes = await axios.post(`${URL_AIGC_INTL}/multimodal-generation/generation`, payload, { headers: getHeaders(), timeout: 120000 });
        
        const imageUrl = syncRes.data?.output?.choices?.[0]?.message?.content?.[0]?.image;
        if (imageUrl) return await downloadAndSaveFile(imageUrl, `image_${Date.now()}.png`, 'images');
        
        const taskId = syncRes.data?.output?.task_id;
        if (taskId) {
            const taskData = await pollTask(taskId, true);
            return await downloadAndSaveFile(taskData.output.choices[0].message.content[0].image, `image_${Date.now()}.png`, 'images');
        }
        throw new Error('Respuesta inesperada');
    } catch (error) {
        if (error.response?.status === 400 || error.message.includes('synchronous')) return await generateImageAsync(prompt);
        throw new Error(`Error generando imagen: ${error.message}`);
    }
};

const generateVideo = async (prompt, fileName = null) => {
    const isI2V = !!fileName;
    if (!prompt && !isI2V) throw new Error('Se requiere prompt o imagen para video');

    const payload = {
        model: isI2V ? "wan2.1-i2v-plus" : "wan2.1-t2v-plus",
        input: { prompt: prompt || "Create a cinematic video" },
        parameters: { prompt_extend: true, duration: 5, audio: true, ...(isI2V ? { resolution: "720P" } : { size: "1280*720" }) }
    };

    if (isI2V) payload.input.img_url = getPublicUrl(fileName, 'images');

    try {
        const createRes = await axios.post(`${URL_AIGC}/video-generation/video-synthesis`, payload, { headers: getHeaders(true), timeout: 30000 });
        const taskId = createRes.data?.output?.task_id;
        if (!taskId) throw new Error('No se pudo crear la tarea de video');
        
        const taskData = await pollTask(taskId, false);
        return await downloadAndSaveFile(taskData.output.video_url, `video_${Date.now()}.mp4`, 'video');
    } catch (error) {
        throw new Error(`Error generando video: ${error.message}`);
    }
};

module.exports = { generateImage, generateVideo };