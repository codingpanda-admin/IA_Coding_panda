// --- CONFIGURACIÓN DE SERVIDOR ---
// Pon aquí tu dominio (ej. 'midominio.com') o tu IP ('47.87.38.80')
const PROD_DOMAIN = '47.87.38.80'; 
const PROD_PORT = '3000';
// Si configuras un dominio con SSL, cambia esto a true (https://)
const USE_HTTPS = false; 

// Detección automática del entorno
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Construcción de la URL dinámica
const protocol = USE_HTTPS && !isLocalhost ? 'https' : 'http';
const domain = isLocalhost ? `localhost:${PROD_PORT}` : `${PROD_DOMAIN}:${PROD_PORT}`;

export const API_URL = `${protocol}://${domain}/api/qwen`;

// --- CONFIGURACIÓN DE MODOS ---
export const MODES = [
  { id: 'chat', name: 'Chat', description: 'Conversacion inteligente', icon: 'chat' },
  { id: 'image', name: 'Imagen', description: 'Genera imagenes desde texto', icon: 'image' },
  { id: 'video', name: 'Video', description: 'Genera video (T2V/I2V)', icon: 'video' },
  { id: 'tts', name: 'Texto a Voz', description: 'Convierte texto a audio', icon: 'audio' },
  { id: 'stt', name: 'Voz a Texto', description: 'Transcribe audio', icon: 'mic' },
  { id: 'vision', name: 'Vision', description: 'Analiza imagenes/documentos', icon: 'eye' },
];