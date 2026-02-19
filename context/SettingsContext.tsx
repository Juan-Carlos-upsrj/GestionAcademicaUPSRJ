import React, { createContext, useContext, ReactNode } from 'react';
import { Settings } from '../types';

interface SettingsContextType {
    settings: Settings;
    updateSettings: (settings: Partial<Settings>) => void;
}

// Initial default (will be overridden by provider)
const defaultSettingsContext: SettingsContextType = {
    settings: {} as Settings,
    updateSettings: () => { },
};

export const SettingsContext = createContext<SettingsContextType>(defaultSettingsContext);

export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
    children: ReactNode;
    settings: Settings;
    updateSettings: (settings: Partial<Settings>) => void;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children, settings, updateSettings }) => {
    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
