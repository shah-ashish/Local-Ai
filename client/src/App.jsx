import React, { useState } from 'react'
import Input from './Feature/InputBox/Input'
import Chatbox from './Feature/ChatBox/Chatbox'
import { streamChatMessage, stopChatMessage } from './Feature/Api/chatApi'

const App = () => {
  const [messages, setMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gemma3:270m');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [abortController, setAbortController] = useState(null);

  const handleSendMessage = async (text, modelName) => {
    if (!text) return;
    setLastUserMessage(text);

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

    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);

    try {
      await streamChatMessage({
        message: text,
        modelName: modelName,
        signal: controller.signal,
        onRequestId: (id) => setActiveRequestId(id),
        onChunk: ({ text: responseText, thinking: thinkingText, askChoice }) => {
          setMessages((prev) => {
            const updated = [...prev];
            const targetIdx = updated.findIndex((m) => m.id === aiMsgId);
            if (targetIdx !== -1) {
              updated[targetIdx] = {
                ...updated[targetIdx],
                text: responseText,
                thinking: thinkingText,
                askChoice: askChoice || null,
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
          // If the request was aborted, we do not treat it as an error to show the user
          if (err.name === 'AbortError' || controller.signal.aborted) {
            return updated;
          }
          updated[targetIdx] = {
            ...updated[targetIdx],
            text: `Error: ${err.message || 'Failed to stream response from backend.'}`,
          };
        }
        return updated;
      });
    } finally {
      setLoading(false);
      setAbortController(null);
      setActiveRequestId(null);
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

  const handleChoiceAnswer = async (aiMsg, answerText) => {
    if (!aiMsg.askChoice) return;
    const { question, options, tool_call_id } = aiMsg.askChoice;
    
    // Find the original user query for this turn
    const idx = messages.findIndex(m => m.id === aiMsg.id);
    const originalUserMsg = idx > 0 ? messages[idx - 1] : null;
    const originalText = originalUserMsg ? originalUserMsg.text : lastUserMessage;
    
    // Clear choices in UI and show thinking
    setMessages((prev) => {
      const updated = [...prev];
      const targetIdx = updated.findIndex((m) => m.id === aiMsg.id);
      if (targetIdx !== -1) {
        updated[targetIdx] = {
          ...updated[targetIdx],
          askChoice: null,
          text: '',
          thinking: '',
        };
      }
      return updated;
    });

    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);

    try {
      await streamChatMessage({
        message: originalText,
        modelName: aiMsg.modelName || selectedModel,
        resume: {
          question,
          options,
          tool_call_id,
          answer: answerText
        },
        signal: controller.signal,
        onRequestId: (id) => setActiveRequestId(id),
        onChunk: ({ text: responseText, thinking: thinkingText }) => {
          setMessages((prev) => {
            const updated = [...prev];
            const targetIdx = updated.findIndex((m) => m.id === aiMsg.id);
            if (targetIdx !== -1) {
              updated[targetIdx] = {
                ...updated[targetIdx],
                text: responseText,
                thinking: thinkingText,
              };
            }
            return updated;
          });
        }
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const targetIdx = updated.findIndex((m) => m.id === aiMsg.id);
        if (targetIdx !== -1) {
          if (err.name === 'AbortError' || controller.signal.aborted) {
            return updated;
          }
          updated[targetIdx] = {
            ...updated[targetIdx],
            text: `Error: ${err.message || 'Failed to resume response.'}`,
          };
        }
        return updated;
      });
    } finally {
      setLoading(false);
      setAbortController(null);
      setActiveRequestId(null);
    }
  };

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort();
    }
    if (activeRequestId) {
      stopChatMessage(activeRequestId);
    }
    setLoading(false);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50/50 p-3 overflow-hidden font-sans">
      {/* Top Header */}


      {/* Main Chat Messages Area */}
      <div className="chat-area w-full flex-1 flex justify-center items-center overflow-hidden bg-white/40">
        <Chatbox
          messages={messages}
          onResend={handleResend}
          onRegenerate={handleRegenerate}
          onAnswer={handleChoiceAnswer}
        />
      </div>

      {/* Bottom Input Area */}
      <div className="chat-input w-full shrink-0 py-3 flex justify-center items-center bg-white/80 border-t border-gray-200/60 backdrop-blur-md rounded-b-xl">
        <Input
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          loading={loading}
          onStop={handleStopMessage}
        />
      </div>
    </div>
  )
}

export default App