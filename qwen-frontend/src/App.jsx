import { useState, useRef, useEffect, useCallback } from 'react';
import { API_URL, MODES } from './config';
import { Icon } from './components/Icon';
import { ChatMessage } from './components/ChatMessage';
import { sendToBackend } from './services/api';
import { detectMediaType } from './utils/helpers';
import './App.css';

function App() {
  const [mode, setMode] = useState('chat');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  const [conversationHistory, setConversationHistory] = useState([]);
  const [documentContext, setDocumentContext] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((content, sender, type = 'text', mediaType = null) => {
    setMessages((prev) => [...prev, {
      id: Date.now(),
      content,
      sender,
      type,
      mediaType,
      timestamp: new Date()
    }]);
  }, []);

  const handleSendMessage = async () => {
    if (isLoading) return;
    
    const text = inputText.trim();
    const file = selectedFile;
    
    // Validaciones
    if (mode === 'chat' && !text) return;
    if (mode === 'image' && !text) return addMessage('Por favor, escribe una descripcion', 'bot', 'error');
    if (mode === 'video' && !text && !file) return addMessage('Escribe un prompt o sube una imagen', 'bot', 'error');
    if (mode === 'tts' && !text) return addMessage('Escribe el texto a convertir', 'bot', 'error');
    if (mode === 'stt' && !file) return addMessage('Sube un archivo de audio', 'bot', 'error');
    if (mode === 'vision' && !file) return addMessage('Sube una imagen o documento', 'bot', 'error');

    const userMsg = file ? `${file.name}${text ? ` - "${text}"` : ''}` : text;
    addMessage(userMsg, 'user', file ? 'file' : 'text');
    
    setInputText('');
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const data = await sendToBackend({ mode, text, file, conversationHistory, documentContext });
      
      if (data.success) {
        const mediaType = detectMediaType(data.data);
        addMessage(data.data, 'bot', mediaType ? 'media' : 'text', mediaType);
        
        if (mode === 'chat') {
          setConversationHistory(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: data.data }]);
        }
        
        if (mode === 'vision' && data.analysisType === 'document' && file) {
          const docContent = data.documentContent || data.data;
          setDocumentContext({
            fileName: file.name,
            content: docContent,
            analysis: data.data,
            timestamp: new Date().toISOString()
          });
          addMessage('Documento cargado en memoria. Hazme preguntas en modo Chat.', 'bot', 'info');
        }
      } else {
        addMessage(`Error: ${data.error || 'Desconocido'}`, 'bot', 'error');
      }
    } catch (error) {
      addMessage(`Error de conexion: ${error.message}`, 'bot', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        startRecordingWithStream(stream);
      } catch (error) {
        addMessage(`Error al acceder al microfono: Asegurate de usar HTTPS o localhost`, 'bot', 'error');
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const startRecordingWithStream = (stream) => {
    const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
    const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    
    mediaRecorderRef.current = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : {});
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType || 'audio/webm' });
      const ext = selectedMimeType?.split('/')[1] || 'webm';
      setSelectedFile(new File([audioBlob], `recording_${Date.now()}.${ext}`, { type: audioBlob.type }));
      setMode('stt');
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (file.type.startsWith('audio/')) setMode('stt');
    else if ((file.type.startsWith('image/') || file.type.startsWith('video/')) && !['video', 'vision'].includes(mode)) setMode('vision');
    else if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) setMode('vision');
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentMode = MODES.find(m => m.id === mode);
  
  const getPlaceholder = () => {
    switch (mode) {
      case 'chat': return 'Escribe tu mensaje...';
      case 'image': return 'Describe la imagen que quieres generar...';
      case 'video': return 'Describe el video o sube una imagen base...';
      case 'tts': return 'Escribe el texto para convertir a voz...';
      case 'stt': return 'Sube un audio o graba con el microfono...';
      case 'vision': return 'Pregunta sobre la imagen o documento...';
      default: return 'Escribe algo...';
    }
  };

  const canSend = () => {
    if (isLoading) return false;
    const text = inputText.trim();
    if (['chat', 'image', 'tts'].includes(mode)) return text.length > 0;
    if (mode === 'video') return text.length > 0 || selectedFile;
    if (['stt', 'vision'].includes(mode)) return selectedFile !== null;
    return false;
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IuY2TUKQoH0RiIh35CCr4lfTCSDl0j.png" alt="HDI Seguros" className="logo" />
        </div>
        <div className="mode-section">
          <h3>Modo de Operacion</h3>
          <div className="mode-cards">
            {MODES.map((m) => (
              <button key={m.id} className={`mode-card ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}>
                <span className="mode-icon"><Icon name={m.icon} size={20} /></span>
                <div className="mode-info">
                  <span className="mode-name">{m.name}</span>
                  <span className="mode-desc">{m.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <p>Powered by Qwen AI</p>
          <p className="api-status">API: {API_URL.replace('/api/qwen', '')}</p>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <div className="header-info">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IuY2TUKQoH0RiIh35CCr4lfTCSDl0j.png" alt="HDI Seguros" className="header-logo" />
            <span className="current-mode">
              <Icon name={currentMode?.icon} size={16} /> {currentMode?.name}
            </span>
          </div>
          <div className="header-actions">
            {(documentContext || conversationHistory.length > 0) && (
              <div className="context-indicator">
                {documentContext && (
                  <span className="context-badge document" title={`Doc: ${documentContext.fileName}`}>
                    Doc: {documentContext.fileName.substring(0, 15)}...
                  </span>
                )}
                {conversationHistory.length > 0 && (
                  <span className="context-badge history">Memoria: {conversationHistory.length} msgs</span>
                )}
                <button className="clear-context-btn" onClick={() => { setConversationHistory([]); setDocumentContext(null); addMessage('Memoria limpiada.', 'bot', 'info'); }}>
                  <Icon name="x" size={14} />
                </button>
              </div>
            )}
            <button className="mobile-mode-btn" onClick={() => setShowModeSelector(!showModeSelector)}>
              <Icon name="settings" size={24} />
            </button>
          </div>
        </header>

        {showModeSelector && (
          <div className="mobile-mode-selector">
            {MODES.map((m) => (
              <button key={m.id} className={`mobile-mode-option ${mode === m.id ? 'active' : ''}`} onClick={() => { setMode(m.id); setShowModeSelector(false); }}>
                <Icon name={m.icon} size={16} /> <span>{m.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className={`chat-messages ${isDragging ? 'dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          {isDragging && (
            <div className="drop-overlay">
              <div className="drop-content"><Icon name="upload" size={48} /><p>Suelta el archivo aqui</p></div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="empty-chat">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IuY2TUKQoH0RiIh35CCr4lfTCSDl0j.png" alt="HDI Seguros" className="empty-logo" />
              <h2>Bienvenido a HDI Chat</h2>
              <p>Selecciona un modo y comienza a crear</p>
              <div className="quick-actions">
                {MODES.slice(0, 4).map((m) => (
                  <button key={m.id} onClick={() => setMode(m.id)}><Icon name={m.icon} size={16} />{m.name}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender} ${msg.type === 'error' ? 'error' : ''}`}>
                {msg.sender === 'bot' && (
                  <div className="message-avatar bot-avatar">
                    <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IuY2TUKQoH0RiIh35CCr4lfTCSDl0j.png" alt="HDI Bot" />
                  </div>
                )}
                <div className="message-content">
                  <ChatMessage msg={msg} />
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message bot loading">
              <div className="message-avatar bot-avatar">
                <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-IuY2TUKQoH0RiIh35CCr4lfTCSDl0j.png" alt="HDI Bot" />
              </div>
              <div className="message-content">
                <div className="typing-indicator"><span></span><span></span><span></span></div>
                <span className="loading-text">Procesando...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="input-area">
          {selectedFile && (
            <div className="file-preview">
              <div className="file-info">
                <Icon name="upload" size={16} />
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button className="remove-file" onClick={removeFile}><Icon name="x" size={16} /></button>
            </div>
          )}

          <div className="input-row">
            <div className="action-buttons">
              <button className="action-btn" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <Icon name="upload" size={20} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
              <button className={`action-btn record-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} disabled={isLoading}>
                <Icon name={isRecording ? 'stop' : 'mic'} size={20} />
              </button>
            </div>

            <div className="text-input-container">
              <textarea placeholder={getPlaceholder()} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} rows="1" disabled={isLoading} />
            </div>

            <button className="send-btn primary" onClick={handleSendMessage} disabled={!canSend()}>
              <Icon name="send" size={20} />
            </button>
          </div>

          <div className="mode-hint">
            Modo: <strong>{currentMode?.name}</strong> - {currentMode?.description}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;