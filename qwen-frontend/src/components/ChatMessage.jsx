import React from 'react';
import { Icon } from './Icon';

export const ChatMessage = ({ msg }) => {
  if (msg.type === 'error') {
    return <p className="error-text">{msg.content}</p>;
  }

  if (msg.type === 'media' && msg.mediaType) {
    switch (msg.mediaType) {
      case 'video':
        return (
          <div className="media-container">
            <video src={msg.content} controls playsInline className="media-video" />
            <a href={msg.content} download className="download-link" target="_blank" rel="noopener noreferrer">
              <Icon name="download" size={16} /> Descargar video
            </a>
          </div>
        );
      case 'audio':
        return (
          <div className="media-container">
            <audio src={msg.content} controls className="media-audio" />
            <a href={msg.content} download className="download-link" target="_blank" rel="noopener noreferrer">
              <Icon name="download" size={16} /> Descargar audio
            </a>
          </div>
        );
      case 'image':
        return (
          <div className="media-container">
            <img src={msg.content} alt="Imagen generada" className="media-image" loading="lazy" />
            <a href={msg.content} download className="download-link" target="_blank" rel="noopener noreferrer">
              <Icon name="download" size={16} /> Descargar imagen
            </a>
          </div>
        );
      default:
        return <p>{msg.content}</p>;
    }
  }

  return <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>;
};