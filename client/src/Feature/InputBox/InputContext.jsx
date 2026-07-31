import React, { createContext, useContext, useState } from 'react';

const InputContext = createContext(null);

export const InputProvider = ({ children }) => {
    const [message, setMessage] = useState('');

    return (
        <InputContext.Provider value={{ message, setMessage }}>
            {children}
        </InputContext.Provider>
    );
};

export const useInputContext = () => {
    const context = useContext(InputContext);
    if (!context) {
        throw new Error('useInputContext must be used within an InputProvider');
    }
    return context;
};
