import React, { useState } from 'react'
import Input from './Feature/InputBox/Input'
import Chatbox from './Feature/ChatBox/Chatbox'
import { streamChatMessage } from './Feature/Api/chatApi'

const App = () => {
  const [messages, setMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gemma3:270m');

  const handleSendMessage = async (text, modelName) => {
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
    };

    const aiMsgId = Date.now() + 1;
    const aiMsg = {
      id: aiMsgId,
      sender: 'ai',
      modelName: modelName,
      text: '',
      thinking: '',
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);

    try {
      await streamChatMessage({
        message: text,
        modelName: modelName,
        onChunk: ({ text: responseText, thinking: thinkingText }) => {
          setMessages((prev) => {
            const updated = [...prev];
            const targetIdx = updated.findIndex((m) => m.id === aiMsgId);
            if (targetIdx !== -1) {
              updated[targetIdx] = {
                ...updated[targetIdx],
                text: responseText,
                thinking: thinkingText,
              };
            }
            return updated;
          });
        },
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const targetIdx = updated.findIndex((m) => m.id === aiMsgId);
        if (targetIdx !== -1) {
          updated[targetIdx] = {
            ...updated[targetIdx],
            text: `Error: ${err.message || 'Failed to stream response from backend.'}`,
          };
        }
        return updated;
      });
    }
  };

  const handleResend = (userMsg) => {
    handleSendMessage(userMsg.text, selectedModel);
  };

  const handleRegenerate = (aiMsg, index) => {
    const prevUserMsg = messages[index - 1];
    if (prevUserMsg && (prevUserMsg.sender === 'user' || prevUserMsg.role === 'user')) {
      handleSendMessage(prevUserMsg.text || prevUserMsg.message, aiMsg.modelName || selectedModel);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50/50 p-3 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="w-full h-12 flex items-center justify-between px-4 border-b border-gray-200/60 bg-white/80 backdrop-blur-md shrink-0 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-base">forum</span>
          </div>
          <span className="font-semibold text-gray-800 text-sm tracking-tight">Local AI Chat</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ollama Active</span>
        </div>
      </header>

      {/* Main Chat Messages Area */}
      <div className="chat-area w-full flex-1 flex justify-center items-center overflow-hidden bg-white/40">
        <Chatbox 
          messages={messages} 
          onResend={handleResend}
          onRegenerate={handleRegenerate}
        />
      </div>

      {/* Bottom Input Area */}
      <div className="chat-input w-full shrink-0 py-3 flex justify-center items-center bg-white/80 border-t border-gray-200/60 backdrop-blur-md rounded-b-xl">
        <Input 
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>
    </div>
  )
}

export default App