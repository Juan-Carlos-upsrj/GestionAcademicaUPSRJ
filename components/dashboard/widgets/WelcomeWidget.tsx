import React, { useContext } from 'react';
import { AppContext } from '../../../context/AppContext';

const WelcomeWidget: React.FC<{ dateString: string }> = ({ dateString }) => {
    const { state } = useContext(AppContext);
    return (
        <div className="flex flex-col justify-center h-full px-4" id="dashboard-welcome-widget">
            <h3 className="font-extrabold text-xl sm:text-2xl mb-1 text-primary truncate tracking-tight">¡Hola, {state.settings.professorName}!</h3>
            <p className="text-sm text-text-secondary font-medium capitalize opacity-80">{dateString}</p>
        </div>
    );
};

export default WelcomeWidget;
