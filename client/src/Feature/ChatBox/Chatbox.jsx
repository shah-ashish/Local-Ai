import React, { useRef, useEffect } from 'react'
import User from './User'
import Ai from './Ai'
import { useChatbox } from './ChatboxContext'
import { useGlobal } from '../../GlobalContext'

const Chatbox = () => {
    const chatEndRef = useRef(null);
    const { messages, sendMessage, resumeWithAnswer } = useChatbox();
    const { selectedModel } = useGlobal();

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleResend = (userMsg) => {
        sendMessage(userMsg.text, selectedModel);
    };

    const handleRegenerate = (aiMsg, index) => {
        const prevUserMsg = messages[index - 1];
        if (prevUserMsg && (prevUserMsg.sender === 'user' || prevUserMsg.role === 'user')) {
            sendMessage(prevUserMsg.text || prevUserMsg.message, aiMsg.modelName || selectedModel);
        }
    };

    if (!messages || messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 select-none">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-3xl">chat</span>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800 text-base">Start a new conversation</h3>
                    <p className="text-sm text-gray-400 max-w-xs mt-1">Select a model below and type a message to begin chatting locally.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full max-w-4xl flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-4 scroll-smooth">
                {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user' || msg.role === 'user';
                    if (isUser) {
                        return (
                            <User 
                                key={msg.id || index} 
                                message={msg.text || msg.message}
                                onResend={() => handleResend(msg)}
                            />
                        );
                    } else {
                        return (
                            <Ai
                                key={msg.id || index}
                                message={msg.text || msg.message}
                                modelName={msg.modelName || msg.model}
                                thinking={msg.thinking}
                                askChoice={msg.askChoice}
                                onAnswer={(answer) => resumeWithAnswer(msg, answer)}
                                onRegenerate={() => handleRegenerate(msg, index)}
                            />
                        );
                    }
                })}
                <div ref={chatEndRef} />
            </div>
        </div>
    )
}

export default Chatbox