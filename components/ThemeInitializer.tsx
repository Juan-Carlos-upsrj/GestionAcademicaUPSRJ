import React, { useContext, useEffect } from 'react';
import { CAREERS } from '../config/careerConfig';
import { AppContext } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';

const ThemeInitializer: React.FC = () => {
    const { state } = useContext(AppContext);
    const { currentUser } = state;
    const { settings } = useSettings();

    // 1. Manejar colores primarios por carrera
    useEffect(() => {
        const root = document.documentElement;

        // Default to isw if no user or invalid career, but also handle the "unlogged" state visually if needed
        const careerId = currentUser?.careerId || 'isw';
        const config = CAREERS[careerId] || CAREERS['isw'];

        // Apply Primary Color
        root.style.setProperty('--color-primary', config.colors.primary);

        // Apply Secondary Color
        root.style.setProperty('--color-primary-hover', config.colors.secondary);

        // Set Document Title
        document.title = `${config.name} - Sistema de Gestión`;

        // Update Favicon
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
            link.href = config.logo || 'logo_IAEV.png';
        } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = config.logo || 'logo_IAEV.png';
            document.head.appendChild(newLink);
        }

    }, [currentUser]); // Re-run when user changes

    // 2. Manejar Modo Oscuro (Tailwind)
    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = () => {
            if (settings.theme === 'dark') {
                root.classList.add('dark');
            } else if (settings.theme === 'classic') {
                root.classList.remove('dark');
            } else if (settings.theme === 'system') {
                // Check OS preference
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (systemPrefersDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        applyTheme();

        // Si es "system", necesitamos escuchar cambios en tiempo real del SO
        if (settings.theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [settings.theme]);

    return null;
};

export default ThemeInitializer;
