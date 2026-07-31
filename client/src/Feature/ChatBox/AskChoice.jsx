import React, { useState } from 'react';

const AskChoice = ({ question, options = [], onAnswer }) => {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customAnswer, setCustomAnswer] = useState("");

    const handleSubmitCustom = (e) => {
        e.preventDefault();
        if (customAnswer.trim()) {
            onAnswer(customAnswer.trim());
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 shadow-xs max-w-lg my-2">
            {/* Header / Question */}
            <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-indigo-600 select-none shrink-0 mt-0.5">
                    help_outline
                </span>
                <span className="font-semibold text-gray-800 text-sm leading-relaxed">
                    {question}
                </span>
            </div>

            {/* Options grid */}
            <div className="flex flex-wrap gap-2">
                {options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => onAnswer(option)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-indigo-55 hover:border-indigo-200 hover:text-indigo-700 transition-colors shadow-2xs cursor-pointer focus:outline-hidden"
                    >
                        {option}
                    </button>
                ))}
                
                {/* Custom/Other option */}
                <button
                    onClick={() => setShowCustomInput((prev) => !prev)}
                    className="px-3 py-1.5 bg-white border border-dashed border-gray-300 text-gray-500 rounded-lg text-xs font-medium hover:bg-gray-55 hover:text-gray-700 transition-colors cursor-pointer focus:outline-hidden flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-xs select-none">edit</span>
                    <span>Other</span>
                </button>
            </div>

            {/* Custom Answer Input */}
            {showCustomInput && (
                <form onSubmit={handleSubmitCustom} className="flex gap-2 border-t border-indigo-100/50 pt-3">
                    <input
                        type="text"
                        value={customAnswer}
                        onChange={(e) => setCustomAnswer(e.target.value)}
                        placeholder="Type custom answer..."
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-indigo-400 focus:outline-hidden bg-white text-gray-800 shadow-2xs"
                    />
                    <button
                        type="submit"
                        disabled={!customAnswer.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer select-none shadow-sm"
                    >
                        <span>Send</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                </form>
            )}
        </div>
    );
};

export default AskChoice;
