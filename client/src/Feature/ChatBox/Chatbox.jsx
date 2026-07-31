import React, { useRef, useEffect } from 'react'
import User from './User'
import Ai from './Ai'

const Chatbox = ({ messages = [], onResend, onRegenerate, onAnswer }) => {
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!messages || messages.length === 0) {
        return (
            <div className="h-full w-full max-w-4xl flex flex-col items-center justify-center text-center p-6 select-none">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
                    <span className="material-symbols-outlined text-2xl">chat</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Local AI Assistant</h3>
                <p className="text-xs text-gray-400 max-w-sm">
                    Select your local model below and type a message to start chatting with your AI.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full max-w-4xl flex flex-col justify-between overflow-hidden">
            {/* Messages Scroll Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-4 scroll-smooth">
                {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user' || msg.role === 'user';
                    if (isUser) {
                        return (
                            <User 
                                key={msg.id || index} 
                                message={msg.text || msg.message}
                                onResend={() => onResend && onResend(msg)}
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
                                onAnswer={(answerText) => onAnswer && onAnswer(msg, answerText)}
                                onRegenerate={() => onRegenerate && onRegenerate(msg, index)}
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