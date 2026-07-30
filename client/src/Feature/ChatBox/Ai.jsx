import React, { useState } from 'react'

const Ai = ({ 
    message = "",
    modelName = "gemma3:270m",
    thinking = "",
    onRegenerate
}) => {
    const [copied, setCopied] = useState(false);
    const [showThinking, setShowThinking] = useState(true);

    const handleCopy = () => {
        if (!message) return;
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const hasThinkingContent = Boolean(thinking && thinking.trim() !== "");

    return (
        <div className="flex justify-start w-full my-3">
            <div className="flex items-start gap-3 max-w-[85%]">
                {/* AI Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-lg select-none">smart_toy</span>
                </div>

                {/* AI Content Wrapper */}
                <div className="flex flex-col gap-1 w-full">
                    {/* Model Badge */}
                    {modelName && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 select-none px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{modelName}</span>
                        </div>
                    )}

                    {/* Thinking Section (HIDDEN if no thinking response coming from backend) */}
                    {hasThinkingContent && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 shadow-xs mb-1">
                            <div 
                                onClick={() => setShowThinking((prev) => !prev)}
                                className="flex items-center justify-between cursor-pointer select-none font-semibold text-amber-800 mb-1"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">psychology</span>
                                    <span>Reasoning Process</span>
                                </div>
                                <span className="material-symbols-outlined text-sm">
                                    {showThinking ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>
                            {showThinking && (
                                <div className="text-amber-800/80 leading-relaxed pt-1 whitespace-pre-wrap border-t border-amber-200/50 mt-1 font-mono text-[11px]">
                                    {thinking}
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Message Content */}
                    <div className="text-gray-800 px-3 py-1 text-sm leading-relaxed whitespace-pre-wrap">
                        {message ? message.trim() : <span className="italic text-gray-400">Thinking...</span>}
                    </div>

                    {/* AI Actions Bar (Copy & Regenerate) */}
                    <div className="flex items-center gap-1 text-gray-400 select-none px-1">
                        <button
                            onClick={handleCopy}
                            title="Copy response"
                            className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1 text-xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">
                                {copied ? 'check' : 'content_copy'}
                            </span>
                            {copied && <span className="text-[11px] font-medium text-emerald-600">Copied</span>}
                        </button>

                        <button
                            onClick={onRegenerate}
                            title="Regenerate response"
                            className="p-1 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1 text-xs cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">refresh</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Ai