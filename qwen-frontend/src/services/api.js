import { API_URL } from '../config';

export const sendToBackend = async ({ mode, text, file, conversationHistory, documentContext }) => {
  let endpoint;
  let options = {
    method: 'POST',
  };

  switch (mode) {
    case 'chat':
      endpoint = '/chat';
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify({ 
        prompt: text,
        conversationHistory,
        documentContext
      });
      break;

    case 'image':
      endpoint = '/generate-image';
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify({ prompt: text });
      break;

    case 'video':
      endpoint = '/generate-video';
      const videoFormData = new FormData();
      if (file) videoFormData.append('file', file);
      videoFormData.append('prompt', text || 'Create a cinematic video');
      options.body = videoFormData;
      break;

    case 'tts':
      endpoint = '/tts';
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify({ prompt: text });
      break;

    case 'stt':
      endpoint = '/audio-stt';
      const sttFormData = new FormData();
      sttFormData.append('file', file);
      if (text) sttFormData.append('prompt', text);
      options.body = sttFormData;
      break;

    case 'vision':
      endpoint = '/multimodal';
      const visionFormData = new FormData();
      visionFormData.append('file', file);
      visionFormData.append('prompt', text || 'Describe esta imagen en detalle');
      options.body = visionFormData;
      break;

    default:
      throw new Error('Modo no soportado');
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  return await response.json();
};