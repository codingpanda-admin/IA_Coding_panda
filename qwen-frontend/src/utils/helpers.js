export const detectMediaType = (url) => {
  if (!url || typeof url !== 'string') return null;
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|webm|mov|avi)($|\?)/)) return 'video';
  if (lower.match(/\.(mp3|wav|ogg|m4a|flac)($|\?)/)) return 'audio';
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)($|\?)/)) return 'image';
  if (lower.includes('/video/') || lower.includes('video_')) return 'video';
  if (lower.includes('/audio/') || lower.includes('tts_')) return 'audio';
  if (lower.includes('/image') || lower.includes('image_')) return 'image';
  return null;
};