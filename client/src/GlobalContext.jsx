import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {
    const [selectedModel, setSelectedModel] = useState('gemma3:270m');

    return (
        <GlobalContext.Provider value={{ selectedModel, setSelectedModel }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};
