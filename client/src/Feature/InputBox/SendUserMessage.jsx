import React from 'react'

const SendUserMessage = ({ message, setMessage, onSend }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className="text-input-container w-full flex-1 flex items-center px-4 pt-2 gap-3">



            {/* Input Field */}
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="w-full h-full bg-transparent outline-none text-gray-800 text-normal font-normal placeholder-gray-400  "
            />

            {/* Google Icon Send Button */}
            <button
                type="button"
                onClick={onSend}
                disabled={!message.trim()}
                title="Send Message"
                className={`send-btn w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${message.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
            >
                <span className="material-symbols-outlined text-xl select-none">
                    arrow_upward
                </span>
            </button>
        </div>
    )
}

export default SendUserMessage