import React, { useState } from 'react'
import SendUserMessage from './SendUserMessage'
import ToolBox from './ToolBox'

const Input = ({ onSendMessage, selectedModel, setSelectedModel }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (!message.trim()) return;

        if (onSendMessage) {
            onSendMessage(message.trim(), selectedModel);
        }

        // Clear input box after sending
        setMessage('');
    };

    return (
        <div className="w-3/5 h-28 rounded-2xl flex flex-col shadow-lg border border-gray-200 bg-white hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
            {/* Input message section */}
            <SendUserMessage
                message={message}
                setMessage={setMessage}
                onSend={handleSend}
            />

            {/* Bottom toolbox section */}
            <ToolBox
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
            />
        </div>
    )
}

export default Input