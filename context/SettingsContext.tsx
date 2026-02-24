import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Settings } from '../types';
import { CompositeDataProvider } from '../services/dataProvider/CompositeDataProvider';

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    isLoading: boolean;
}

const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const defaultSettings: Settings = {
    semesterStart: getLocalDateStr(),
    firstPartialEnd: getLocalDateStr(),
    semesterEnd: getLocalDateStr(),
    p1EvalStart: getLocalDateStr(),
    p1EvalEnd: getLocalDateStr(),
    p2EvalStart: getLocalDateStr(),
    p2EvalEnd: getLocalDateStr(),
    showMatricula: true,
    showTeamsInGrades: true,
    failByAttendance: true,
    sidebarGroupDisplayMode: 'name-abbrev',
    theme: 'system',
    lowAttendanceThreshold: 80,
    googleCalendarUrl: '',
    googleCalendarColor: 'blue',
    professorName: 'Nombre del Profesor',
    apiUrl: '',
    apiKey: '',
    mobileUpdateUrl: 'https://github.com/Juan-Carlos-upsrj/TestListas',
    enableReminders: true,
    reminderTime: 20,
};

const defaultSettingsContext: SettingsContextType = {
    settings: defaultSettings,
    updateSettings: () => { },
    isLoading: true,
};

export const SettingsContext = createContext<SettingsContextType>(defaultSettingsContext);
export const useSettings = () => useContext(SettingsContext);

const SETTINGS_CACHE_KEY = 'app_settings_cache';

const getInitialSettings = (): Settings => {
    try {
        const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            return { ...defaultSettings, ...parsed };
        }
    } catch (e) {
        console.error("Failed to parse settings cache", e);
    }
    return defaultSettings;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(getInitialSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const dataProvider = new CompositeDataProvider();
                const loadedState = await dataProvider.load() as any;
                if (loadedState && loadedState.settings) {
                    const mergedSettings = { ...defaultSettings, ...loadedState.settings };
                    setSettings(mergedSettings);
                    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(mergedSettings));
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, []);

    const updateSettings = async (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(updated));

        try {
            const dataProvider = new CompositeDataProvider();
            const currentState = await dataProvider.load();
            if (currentState) {
                const newState = { ...currentState, settings: updated } as any;
                await dataProvider.save(newState);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};
