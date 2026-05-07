// services/qwen/multimodal.service.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { URL_COMPATIBLE, getHeaders, getPublicUrl } = require('./core.service');
const { extractDocumentContent } = require('./extractor.service');

const chatVision = async (fileName, prompt = 'Describe esta imagen en detalle') => {
    const ext = path.extname(fileName).toLowerCase();
    const filePath = path.join(process.cwd(), 'uploads', 'images', fileName);
    
    let imageContent;
    if (fs.existsSync(filePath)) {
        const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        imageContent = { type: "image_url", image_url: { url: `data:${mimeType};base64,${fs.readFileSync(filePath).toString('base64')}` } };
    } else {
        imageContent = { type: "image_url", image_url: { url: getPublicUrl(fileName, 'images') } };
    }

    const payload = { model: "qwen-vl-max", messages: [{ role: "user", content: [imageContent, { type: "text", text: prompt }] }] };
    
    try {
        const response = await axios.post(`${URL_COMPATIBLE}/chat/completions`, payload, { headers: getHeaders(), timeout: 90000 });
        return response.data?.choices?.[0]?.message?.content;
    } catch (error) {
        throw new Error(`Error visual: ${error.message}`);
    }
};

const analyzeDocument = async (fileName, prompt = 'Resume este documento') => {
    const ext = path.extname(fileName).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return await chatVision(fileName, prompt);

    const filePath = path.join(process.cwd(), 'uploads', 'documents', fileName);
    if (!fs.existsSync(filePath)) throw new Error(`Archivo no encontrado`);

    const documentContent = await extractDocumentContent(filePath, ext);
    const maxChars = 100000;
    const contentToAnalyze = documentContent.length > maxChars ? documentContent.substring(0, maxChars) + '\n[truncado]' : documentContent;

    const payload = {
        model: "qwen-plus",
        messages: [
            { role: "system", content: "Eres un analista experto. Usa el documento para responder al usuario." },
            { role: "user", content: `Documento:\n${contentToAnalyze}\n\nPregunta: ${prompt}` }
        ]
    };

    const response = await axios.post(`${URL_COMPATIBLE}/chat/completions`, payload, { headers: getHeaders(), timeout: 120000 });
    
    return {
        analysis: response.data.choices[0].message.content,
        extractedContent: contentToAnalyze,
        originalLength: documentContent.length,
        truncated: documentContent.length > maxChars
    };
};

module.exports = { chatVision, analyzeDocument };