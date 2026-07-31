import React from 'react'
import Input from './Feature/InputBox/Input'
import Chatbox from './Feature/ChatBox/Chatbox'
import { GlobalProvider } from './GlobalContext'
import { ChatboxProvider } from './Feature/ChatBox/ChatboxContext'

const ChatAppContent = () => {
  return (
    <div className="w-full h-screen flex flex-col bg-slate-50/50 p-3 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="w-full h-12 flex items-center justify-between px-4 border-b border-gray-200/60 bg-white/80 backdrop-blur-md shrink-0 rounded-t-xl select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-base">forum</span>
          </div>
          <span className="font-semibold text-gray-800 text-sm tracking-tight">Local AI Chat</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ollama Active</span>
        </div>
      </header>

      {/* Main Chat Messages Area */}
      <div className="chat-area w-full flex-1 flex justify-center items-center overflow-hidden bg-white/40">
        <Chatbox />
      </div>

      {/* Bottom Input Area */}
      <div className="chat-input w-full shrink-0 py-3 flex justify-center items-center bg-white/80 border-t border-gray-200/60 backdrop-blur-md rounded-b-xl">
        <Input />
      </div>
    </div>
  )
}

const App = () => {
  return (
    <GlobalProvider>
      <ChatboxProvider>
        <ChatAppContent />
      </ChatboxProvider>
    </GlobalProvider>
  )
}

export default App