import React from 'react'
import SendUserMessage from './SendUserMessage'
import ToolBox from './ToolBox'
import { InputProvider } from './InputContext'

const InputContent = () => {
    return (
        <div className="w-3/5 h-28 rounded-2xl flex flex-col shadow-lg border border-gray-200 bg-white hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
            {/* Input message section */}
            <SendUserMessage />

            {/* Bottom toolbox section */}
            <ToolBox />
        </div>
    )
}

const Input = () => {
    return (
        <InputProvider>
            <InputContent />
        </InputProvider>
    )
}

export default Input