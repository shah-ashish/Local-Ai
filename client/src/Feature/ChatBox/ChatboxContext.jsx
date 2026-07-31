import React, { createContext, useContext } from 'react';
import { useChatSession } from '../Chat/useChatSession';

const ChatboxContext = createContext(null);

export const ChatboxProvider = ({ children }) => {
    const session = useChatSession();

    return (
        <ChatboxContext.Provider value={session}>
            {children}
        </ChatboxContext.Provider>
    );
};

export const useChatbox = () => {
    const context = useContext(ChatboxContext);
    if (!context) {
        throw new Error('useChatbox must be used within a ChatboxProvider');
    }
    return context;
};
