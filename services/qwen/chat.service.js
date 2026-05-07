// services/qwen/chat.service.js
const axios = require('axios');
const { URL_COMPATIBLE, getHeaders } = require('./core.service');
const DatabaseService = require('../database.service'); // Usamos la fachada de BD que ya creaste

const chat = async (prompt, enableThinking = true, conversationHistory = [], documentContext = null) => {
    if (!prompt || typeof prompt !== 'string') throw new Error('El prompt es requerido y debe ser texto');

    const messages = [];
    let dbContextStr = '';
    
    if (DatabaseService.isDBConnected()) {
        try {
            const dbContext = await DatabaseService.getContextData();
            if (dbContext) {
                dbContextStr = `
=== INFORMACIÓN DE SEGUROS HDI (Base de Datos) ===
TIPOS DE SEGUROS DISPONIBLES:
${dbContext.tiposSeguros?.map(t => `- ${t.nombre} (${t.codigo}): ${t.descripcion || ''}`).join('\n') || 'No disponible'}
COBERTURAS DE SEGURO DE AUTO:
${dbContext.coberturas?.filter(c => c.tipo_seguro_nombre?.includes('Auto')).map(c => `- ${c.nombre}: ${c.descripcion || ''} (Deducible: ${c.deducible_porcentaje}%)`).join('\n') || 'No disponible'}
TARIFAS BASE:
${dbContext.tarifas?.map(t => `- ${t.nombre}: $${t.prima_base} MXN anual`).join('\n') || 'No disponible'}
ZONAS Y FACTORES DE RIESGO:
${dbContext.zonas?.map(z => `- ${z.nombre} (${z.codigo}): Factor ${z.factor_riesgo}`).join('\n') || 'No disponible'}
MARCAS DE VEHÍCULOS Y FACTORES:
${dbContext.marcas?.map(m => `- ${m.nombre}: Factor ${m.factor_riesgo}`).join('\n') || 'No disponible'}
CONFIGURACIÓN:
- IVA: ${dbContext.configuracion?.IVA_PORCENTAJE || 16}%
- Descuento pago anual: ${dbContext.configuracion?.DESCUENTO_PAGO_ANUAL || 10}%
- Vigencia cotización: ${dbContext.configuracion?.VIGENCIA_COTIZACION_DIAS || 30} días
Cuando el usuario pregunte por cotizaciones de seguros, usa esta información.`;
            }
        } catch (dbErr) {
            console.log(`[DB CONTEXT] Error: ${dbErr.message}`);
        }
    }
    
    if (documentContext && documentContext.content) {
        messages.push({
            role: "system",
            content: `Eres un asistente inteligente de HDI Seguros.\n${dbContextStr}\nDocumento "${documentContext.fileName}":\n${documentContext.content.substring(0, 50000)}`
        });
    } else {
        messages.push({
            role: "system",
            content: `Eres un asistente inteligente de HDI Seguros.\n${dbContextStr}`
        });
    }
    
    const recentHistory = conversationHistory.slice(-20);
    for (const msg of recentHistory) {
        if (msg.role && msg.content) messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: prompt });

    try {
        const response = await axios.post(`${URL_COMPATIBLE}/chat/completions`, {
            model: "qwen-plus",
            messages,
            stream: false,
            enable_thinking: enableThinking
        }, { headers: getHeaders(), timeout: 90000 });
        
        return response.data?.choices?.[0]?.message?.content;
    } catch (error) {
        throw new Error(`Error en chat: ${error.response?.data?.error?.message || error.message}`);
    }
};

module.exports = { chat };