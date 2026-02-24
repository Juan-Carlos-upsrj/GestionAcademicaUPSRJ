import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../icons/Icon';
import { Outlet, useLocation } from 'react-router-dom';
import ThemeInitializer from '../ThemeInitializer';
import BackgroundShapesV2 from '../common/BackgroundShapesV2';
import ToastContainer from '../ToastContainer';
import { useSettings } from '../../context/SettingsContext';

const MainLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { settings, updateSettings } = useSettings();

    const toggleTheme = () => {
        const nextTheme = settings.theme === 'dark' ? 'classic' : 'dark';
        updateSettings({ theme: nextTheme });
    };
    const getTitle = (path: string) => {
        if (path === '/') return 'Inicio';
        if (path === '/groups') return 'Grupos';
        if (path === '/teams') return 'Equipos';
        if (path === '/attendance') return 'Asistencia';
        if (path === '/calendar') return 'Calendario';
        if (path.startsWith('/grades')) return 'Calificaciones';
        if (path === '/reports') return 'Reportes';
        if (path === '/tutorship') return 'Tutoreo';
        return 'Gestión Académica';
    };

    const isFullScreenView = location.pathname.startsWith('/grades') || location.pathname === '/attendance' || location.pathname === '/teams';
    const currentTitle = getTitle(location.pathname);

    return (
        <div className="flex h-screen bg-background text-text-primary font-sans relative overflow-hidden">
            <ThemeInitializer />
            <BackgroundShapesV2 />

            {/* Notifications and Modals would logically go here or in a global provider */}
            <ToastContainer />

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    />
                )}
            </AnimatePresence>

            <main className="flex-1 flex flex-col min-w-0 w-full overflow-hidden z-10 relative">
                <header className="flex-shrink-0 w-full relative">
                    <div className="flex items-center p-4 bg-surface/80 backdrop-blur-sm border-b border-border-color">
                        <button
                            aria-label="Open menu"
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-1 mr-3 rounded-md text-text-secondary hover:bg-surface-secondary md:hidden"
                        >
                            <Icon name="align-justify" className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-primary flex-1 truncate pr-4">
                            {currentTitle}
                        </h1>
                        <button
                            onClick={toggleTheme}
                            className="p-2 ml-auto rounded-full bg-surface-secondary text-text-secondary hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm border border-border-color flex-shrink-0"
                            title="Cambiar Modo Oscuro/Claro"
                        >
                            <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className={`flex-1 flex flex-col min-w-0 w-full ${isFullScreenView ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className={`flex-1 min-w-0 w-full p-3 sm:p-5 lg:p-6 flex flex-col ${isFullScreenView ? 'h-full min-h-0' : 'min-h-0 pb-10'}`}
                        >
                            <Outlet />

                            {!isFullScreenView && (
                                <footer className="mt-12 shrink-0 p-4 w-full text-center">
                                    <div className="max-w-4xl mx-auto space-y-1.5 opacity-60">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                            © 2026 Juan Carlos Salgado Robles. Todos los derechos reservados.
                                        </p>
                                    </div>
                                </footer>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
