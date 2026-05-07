// services/qwen/audio.service.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { getHeaders, getPublicUrl } = require('./core.service');

const textToSpeech = async (text) => {
    if (!text) throw new Error('El texto es requerido para TTS');
    
    return new Promise((resolve, reject) => {
        const taskId = uuidv4().replace(/-/g, '');
        const audioChunks = [];
        const ws = new WebSocket('wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference', {
            headers: { 'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}` }
        });
        
        const timeout = setTimeout(() => { ws.close(); reject(new Error('Timeout: TTS tardó demasiado')); }, 60000);
        
        ws.on('open', () => {
            ws.send(JSON.stringify({ header: { action: "run-task", task_id: taskId, streaming: "duplex" }, payload: { task_group: "audio", task: "tts", function: "SpeechSynthesizer", model: "cosyvoice-v3-flash", parameters: { text_type: "PlainText", voice: "longanyang", format: "mp3", sample_rate: 22050, volume: 50, rate: 1, pitch: 1 }, input: {} } }));
        });
        
        ws.on('message', (data) => {
            try {
                const event = JSON.parse(data.toString());
                if (event.header?.code && event.header.code !== 'Success' && event.header.code !== 0) {
                    clearTimeout(timeout); ws.close(); reject(new Error(`TTS Error: ${event.header.message}`));
                    return;
                }
                
                if (event.header?.action === 'task-started') {
                    ws.send(JSON.stringify({ header: { action: "continue-task", task_id: taskId, streaming: "duplex" }, payload: { input: { text: text } } }));
                    ws.send(JSON.stringify({ header: { action: "finish-task", task_id: taskId, streaming: "duplex" }, payload: { input: {} } }));
                }
                
                if (event.payload?.output?.audio) audioChunks.push(Buffer.from(event.payload.output.audio, 'base64'));
                
                if (event.header?.action === 'task-finished') {
                    clearTimeout(timeout); ws.close();
                    if (audioChunks.length > 0) {
                        const localFileName = `tts_${Date.now()}.mp3`;
                        fs.writeFileSync(path.join(process.cwd(), 'uploads', 'audio', localFileName), Buffer.concat(audioChunks));
                        resolve(getPublicUrl(localFileName, 'audio'));
                    } else reject(new Error('No se recibió audio'));
                }
            } catch (e) {
                if (Buffer.isBuffer(data)) audioChunks.push(data);
            }
        });
        
        ws.on('error', (err) => { clearTimeout(timeout); reject(err); });
    });
};

const audioToText = async (fileName) => {
    if (!fileName) throw new Error('Se requiere un archivo de audio');
    
    try {
        const payload = { model: "fun-asr", input: { file_urls: [getPublicUrl(fileName, 'audio')] }, parameters: { language_hints: ["es", "en", "zh"] } };
        const createRes = await axios.post(`https://dashscope-intl.aliyuncs.com/api/v1/services/audio/asr/transcription`, payload, { headers: getHeaders(true), timeout: 30000 });
        
        const taskId = createRes.data?.output?.task_id;
        if (!taskId) throw new Error('No se pudo crear la tarea');

        let attempts = 0;
        while (attempts < 30) {
            await new Promise(r => setTimeout(r, 3000));
            attempts++;
            const checkRes = await axios.get(`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`, { headers: getHeaders(), timeout: 30000 });
            
            if (checkRes.data?.output?.task_status === 'SUCCEEDED') {
                const transUrl = checkRes.data.output.results[0]?.transcription_url;
                if (transUrl) {
                    const transRes = await axios.get(transUrl);
                    return transRes.data?.transcripts?.[0]?.text || transRes.data?.text;
                }
                return checkRes.data.output.results[0]?.text;
            }
        }
        throw new Error('Timeout en transcripción');
    } catch (error) {
        throw new Error(`Error en STT: ${error.message}`);
    }
};

module.exports = { textToSpeech, audioToText };