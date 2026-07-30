import React, { useState, useRef, useEffect } from 'react'

const AVAILABLE_MODELS = [
    { id: 'gemma3:270m', name: 'Gemma 3 (270M)', badge: 'Fast & Light' },
    { id: 'llama3:8b', name: 'Llama 3 (8B)', badge: 'Meta AI' },
    { id: 'mistral:7b', name: 'Mistral (7B)', badge: 'Balanced' },
    { id: 'deepseek-r1:8b', name: 'DeepSeek R1 (8B)', badge: 'Reasoning' },
    { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', badge: 'General' },
    { id: 'gemma4:latest', name: 'Gemma 4 (4B)', badge: 'General' },

];

const ToolBox = ({ selectedModel, setSelectedModel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

    return (
        <div className="tool-box w-full h-2/5 shrink-0 px-4 py-1 flex items-center justify-between border-t border-gray-100 bg-gray-50/50 rounded-b-xl select-none">
            {/* Left side: Custom Div-based Model Selection */}
            <div className="relative" ref={dropdownRef}>
                {/* Clickable Model Selector Trigger (DIV) */}
                <div
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white shadow-xs hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all duration-150 text-xs font-medium text-gray-700"
                >
                    <span className="material-symbols-outlined text-blue-600 text-lg">
                        memory
                    </span>
                    <span>{currentModelObj.name}</span>
                    <span className={`material-symbols-outlined text-gray-400 text-base transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </div>

                {/* Custom Dropdown Menu (DIV Popup, NO option tags used!) */}
                {isOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl py-1 z-50">
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                            Select AI Model
                        </div>
                        <div className="py-1 max-h-56 overflow-y-auto">
                            {AVAILABLE_MODELS.map((model) => {
                                const isSelected = selectedModel === model.id;
                                return (
                                    <div
                                        key={model.id}
                                        onClick={() => {
                                            setSelectedModel(model.id);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors duration-150 ${isSelected
                                            ? 'bg-blue-50 text-blue-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-base ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {isSelected ? 'check_circle' : 'circle'}
                                            </span>
                                            <div className="flex flex-col">
                                                <span>{model.name}</span>
                                                <span className="text-[10px] text-gray-400 font-normal">{model.id}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-normal">
                                            {model.badge}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Right side: Quick Action Tool Icons */}
            <div className="flex items-center gap-1">
                <div
                    title="Attach file"
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200/60 rounded-lg cursor-pointer transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">attach_file</span>
                </div>
                <div
                    title="Search web"
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200/60 rounded-lg cursor-pointer transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">language</span>
                </div>
                <div
                    title="Reasoning mode"
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-200/60 rounded-lg cursor-pointer transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">psychology</span>
                </div>
            </div>
        </div>
    )
}

export default ToolBox