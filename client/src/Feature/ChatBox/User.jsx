import React, { useState } from 'react'

const User = ({ message = "", onResend }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!message) return;
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex justify-end w-full my-3">
            <div className="flex items-start gap-3 max-w-[80%] flex-row-reverse">
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-lg select-none">person</span>
                </div>

                {/* Content & Action Bar Wrapper */}
                <div className="flex flex-col items-end gap-1">
                    {/* Message Content */}
                    <div className="text-gray-800 px-3 py-1 text-sm leading-relaxed whitespace-pre-wrap text-right">
                        {message ? message.trim() : ""}
                    </div>

                    {/* User Actions Bar (Copy & Resend) */}
                    <div className="flex items-center gap-1 text-gray-400 select-none">
                        <button
                            onClick={handleCopy}
                            title="Copy message"
                            className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1 text-xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">
                                {copied ? 'check' : 'content_copy'}
                            </span>
                            {copied && <span className="text-[11px] font-medium text-emerald-600">Copied</span>}
                        </button>

                        <button
                            onClick={onResend}
                            title="Resend message"
                            className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1 text-xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">replay</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default User