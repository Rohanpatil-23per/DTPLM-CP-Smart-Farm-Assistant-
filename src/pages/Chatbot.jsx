/**
 * Enhanced Chatbot Component with Chat History Integration
 * 
 * MERGE NOTE: This version includes local enhancements not in GitHub repo:
 * - ChatHistory sidebar (new component)
 * - User persistence via localStorage (getUserId)
 * - Voice recognition with Web Speech API
 * - ReactMarkdown rendering
 * - Auto-retry on network errors
 * - Smooth loading transitions
 * 
 * These enhancements are backward compatible with GitHub version.
 * Keep this version during merge - it's superior.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, CloudSun, Droplets, Leaf, LineChart, Mic, Send, Volume2 } from 'lucide-react';
import ChatHistory from '../components/ChatHistory';
import { useAuth } from '../context/AuthContext';
import '../styles/Chatbot.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;

// Fallback guest ID persisted in localStorage for unauthenticated users
function getGuestId() {
  let guestId = localStorage.getItem('smart_farm_guest_id');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('smart_farm_guest_id', guestId);
  }
  return guestId;
}

function Chatbot() {
  const { user, isAuthenticated } = useAuth();

  // Use the authenticated user's DB id, or a persistent guest id as fallback
  const userId = useMemo(
    () => (isAuthenticated && user?.id ? user.id : getGuestId()),
    [isAuthenticated, user?.id]
  );

  const WELCOME_MESSAGE = {
    id: 1,
    text: 'Hello! I am your Smart Farming Assistant. How can I help you today?',
    sender: 'bot',
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasVoiceSupport, setHasVoiceSupport] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);  

  // Reset conversation when user logs in or out
  useEffect(() => {
    setMessages([WELCOME_MESSAGE]);
    setCurrentConversationId(null);
    setRefreshHistory(prev => prev + 1);
  }, [userId]);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const isManualStopRef = useRef(false);

  useEffect(() => {
    if (!chatContainerRef.current) return;
    const container = chatContainerRef.current;
    const id = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [messages, isLoading]);

  // Set up browser speech recognition once (Web Speech API).
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition;

    if (!SpeechRecognition) {
      setHasVoiceSupport(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    let finalTranscript = '';

    recognition.onstart = () => {
      console.log('✓ Microphone is ON - speak your question');
      finalTranscript = '';
      setIsListening(true);
    };
    
    recognition.onend = () => {
      console.log('✓ Microphone stopped');
      setIsListening(false);
      
      // Add captured text to input
      if (finalTranscript.trim()) {
        setInputValue((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript).trim());
        console.log('✓ Added:', finalTranscript.trim());
      } else {
        console.log('⚠ No speech captured');
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Voice error:', event.error);
      
      // Handle specific errors
      if (event.error === 'not-allowed') {
        setIsListening(false);
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'no-speech') {
        console.log('⚠ No speech detected');
        // Don't stop - might just be a pause
      } else if (event.error === 'audio-capture') {
        setIsListening(false);
        alert('No microphone found. Please check your microphone connection.');
      } else if (event.error === 'network') {
        console.warn('⚠ Network error - auto-retrying...');
        // Auto-retry on network error if not manually stopped
        if (!isManualStopRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
              console.log('↻ Retried successfully');
            } catch (e) {
              console.log('Retry failed:', e.message);
              setIsListening(false);
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      } else if (event.error === 'aborted') {
        console.log('Recognition aborted');
        setIsListening(false);
      } else {
        console.error('Recognition error:', event.error);
      }
    };
    recognition.onresult = (event) => {
      let interimText = '';
      let currentFinal = '';

      for (let i = 0; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          currentFinal += transcript + ' ';
          console.log('✓ Heard:', transcript);
        } else {
          interimText += transcript;
        }
      }

      finalTranscript = currentFinal;

      // Show interim results in console
      if (interimText) {
        console.log('🎤 Listening:', interimText);
      }
    };

    recognitionRef.current = recognition;
    setHasVoiceSupport(true);

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // Ignore errors on cleanup
      }
    };
  }, []);

  const handleToggleMic = () => {
    if (!hasVoiceSupport) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert('Voice recognition not initialized. Please refresh the page.');
      return;
    }

    if (isListening) {
      console.log('Manually stopping recognition...');
      isManualStopRef.current = true;
      recognition.stop();
      setTimeout(() => {
        isManualStopRef.current = false;
      }, 500);
    } else {
      console.log('Starting voice recognition - speak immediately!');
      isManualStopRef.current = false;
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start voice input:', err);
        
        // Provide helpful error messages
        if (err.name === 'NotAllowedError') {
          alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else if (err.message.includes('already started')) {
          // Recognition already running, try to stop and restart
          recognition.stop();
          setTimeout(() => {
            try {
              recognition.start();
            } catch (retryErr) {
              alert('Could not start voice recognition. Please try again.');
            }
          }, 100);
        } else {
          alert(`Voice input error: ${err.message || 'Unknown error'}. Make sure you're using HTTPS or localhost.`);
        }
      }
    }
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      setIsLoadingConversation(true);
      const response = await fetch(`${API_BASE}/api/conversations/${conversationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      
      const data = await response.json();
      
      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Convert messages to UI format
      const loadedMessages = data.messages.map((msg, index) => ({
        id: index + 1,
        text: msg.content,
        sender: msg.role,
        timestamp: new Date(msg.timestamp),
      }));
      
      setMessages(
        loadedMessages.length > 0
          ? loadedMessages
          : [{ ...WELCOME_MESSAGE, timestamp: new Date() }]
      );
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleNewConversation = (conversationId) => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }]);
    setCurrentConversationId(conversationId);
  };

  const handleToggleTTS = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Find the latest bot message
    const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
    if (!lastBotMessage || !lastBotMessage.text) return;

    // Strip markdown formatting for cleaner speech
    const cleanText = lastBotMessage.text
      .replace(/[#*`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessageText = async (textToSend) => {
    if (!textToSend || textToSend.trim() === '') return;
    const query = textToSend.trim();

    const msgTimestamp = Date.now();
    // Add user message
    const userMessage = {
      id: `user_${msgTimestamp}`,
      text: query,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build rich context from farm data
      const context = `
📍 Location: Pune, Maharashtra, India
🌡️ Current Weather: Clear sky, Temperature 28°C, Humidity 52%
💧 Soil Moisture: Medium (45%)
🌾 Active Crop: Wheat
📊 Growth Stage: Vegetative phase (32 days)
🌧️ Rainfall Status: No rain expected in next 24 hours
💰 Budget: Medium-scale farm`;

      // Call FastAPI backend using environment variable
      const backendUrl = `${API_BASE}/chat`;
      console.log('Sending request to:', backendUrl);
      console.log('Message:', query);
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          context: context,
          language: 'en',
          conversation_id: currentConversationId,
          user_id: userId,
        }),
      });
      
      if (!response.ok) {
        console.error('Backend returned error:', response.status, response.statusText);
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      // Update conversation ID if new conversation was created
      if (data.conversation_id && data.conversation_id !== currentConversationId) {
        setCurrentConversationId(data.conversation_id);
      }
      
      // Always refresh chat history to update titles and message counts
      setRefreshHistory(prev => prev + 1);

      const botMessage = {
        id: `bot_${Date.now()}`,
        text: data.reply || data.error || 'Unable to get response. Please check backend.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error.message);
      const errorMessage = {
        id: `err_${Date.now()}`,
        text: `Connection error: ${error.message}. Make sure FastAPI backend is running on ${API_BASE}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendMessageText(inputValue);
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-layout">
        <ChatHistory 
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          currentConversationId={currentConversationId}
          userId={userId}
          refreshTrigger={refreshHistory}
        />
        
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="header-icon">
              <Bot size={28} />
            </div>
            <div>
              <h1>Smart Farming Chatbot</h1>
              <p>Ask about crop management, irrigation, or yield strategy.</p>
            </div>
          </div>

        <div className="chat-box">
          <div className={`messages-container ${isLoadingConversation ? 'loading' : ''}`} ref={chatContainerRef}>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-bubble">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-bubble">
                  <p>Thinking...</p>
                  <span className="message-time">
                    {new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <div className="input-wrapper">
              <button
                type="button"
                className={`icon-btn ${isListening ? 'listening' : ''}`}
                title={
                  !hasVoiceSupport
                    ? 'Voice input not supported'
                    : isListening
                    ? '🎤 Recording... Click again to stop'
                    : 'Click to start voice input'
                }
                onClick={handleToggleMic}
                disabled={!hasVoiceSupport || isLoading}
              >
                <Mic size={18} />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your question..."
                className="chat-input"
              />
              <button
                type="button"
                className={`icon-btn ${isSpeaking ? 'listening' : ''}`}
                title={isSpeaking ? "🔊 Speaking... Click to stop" : "🔊 Listen to latest answer"}
                onClick={handleToggleTTS}
              >
                <Volume2 size={18} />
              </button>
              <button type="submit" className="send-btn" disabled={isLoading}>
                <Send size={16} /> {isLoading ? 'Loading...' : 'Send'}
              </button>
            </div>
          </form>
        </div>

        <div className="quick-tips">
          <h3>Quick Tips (Click to ask)</h3>
          <div className="tips-grid">
            <div className="tip-card" style={{ cursor: 'pointer' }} onClick={() => sendMessageText('What is the best irrigation schedule for wheat in current weather?')}>
              <span className="tip-icon">
                <Droplets size={18} />
              </span>
              <p>Ask about irrigation schedules</p>
            </div>
            <div className="tip-card" style={{ cursor: 'pointer' }} onClick={() => sendMessageText('Which crop is best for sandy soil and medium water supply?')}>
              <span className="tip-icon">
                <Leaf size={18} />
              </span>
              <p>Try: "Which crop for sandy soil?"</p>
            </div>
            <div className="tip-card" style={{ cursor: 'pointer' }} onClick={() => sendMessageText('What are the key fertilizer recommendations for vegetative stage?')}>
              <span className="tip-icon">
                <Leaf size={18} />
              </span>
              <p>Get fertilizer recommendations</p>
            </div>
            <div className="tip-card" style={{ cursor: 'pointer' }} onClick={() => sendMessageText('How should I protect my crops against high temperature and pests?')}>
              <span className="tip-icon">
                <CloudSun size={18} />
              </span>
              <p>Weather & pest protection advice</p>
            </div>
            <div className="tip-card" style={{ cursor: 'pointer' }} onClick={() => sendMessageText('What techniques can maximize yield for wheat farming?')}>
              <span className="tip-icon">
                <LineChart size={18} />
              </span>
              <p>Yield optimization tips</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Chatbot;
