import React, { useContext, useEffect } from 'react';
import { CAREERS } from '../config/careerConfig';
import { AppContext } from '../context/AppContext';

const ThemeInitializer: React.FC = () => {
    const { state } = useContext(AppContext);
    const { currentUser } = state;

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

    return null;
};

export default ThemeInitializer;
