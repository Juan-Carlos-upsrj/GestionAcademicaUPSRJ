import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../icons/Icon';
import { useSettings } from '../../context/SettingsContext';
import { AppContext } from '../../context/AppContext';
import { SYSTEM_API_URL, SYSTEM_API_KEY } from '../../constants';
import { AvisoBaja } from '../common/AvisosBajas';

const BajasDropdown: React.FC = () => {
    const { settings } = useSettings();
    const { state } = useContext(AppContext);
    const [avisos, setAvisos] = useState<AvisoBaja[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const activeApiUrl = settings.apiUrl && settings.apiUrl.trim() !== '' ? settings.apiUrl : SYSTEM_API_URL;
        const activeApiKey = settings.apiKey && settings.apiKey.trim() !== '' ? settings.apiKey : SYSTEM_API_KEY;
        const careerToUse = state.currentUser?.careerId || 'IAEV';
        
        if (!activeApiUrl || !settings.professorName || settings.professorName === 'Nombre del Profesor') return;

        const checkAvisos = async () => {
            try {
                const response = await fetch(activeApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-API-KEY': activeApiKey, 'X-CARRERA': careerToUse },
                    body: JSON.stringify({ action: 'get-avisos', profesor_nombre: settings.professorName, carrera: careerToUse })
                });
                
                const res = await response.json();
                if (res.status === 'success' && res.data) {
                    setAvisos(res.data);
                }
            } catch (err) {
                console.error("Error obteniendo avisos de baja en dropdown:", err);
            }
        };

        checkAvisos();
        const interval = setInterval(checkAvisos, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [settings.apiUrl, settings.professorName, settings.apiKey, state.currentUser?.careerId]);

    const hasUnread = avisos.some(aviso => !localStorage.getItem('aviso_visto_' + aviso.id));

    if (avisos.length === 0) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[40] sm:bottom-28">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-16 right-0 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
                        style={{ maxHeight: '60vh' }}
                    >
                        <div className="bg-orange-50 dark:bg-orange-900/30 p-4 border-b border-orange-100 dark:border-orange-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon name="user-minus" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                <h4 className="font-bold text-orange-800 dark:text-orange-300">Alumnos en Baja</h4>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-orange-600/60 hover:text-orange-600 dark:hover:text-orange-300">
                                <Icon name="x" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2 custom-scrollbar">
                            {avisos.map(aviso => {
                                const isUnread = !localStorage.getItem('aviso_visto_' + aviso.id);
                                return (
                                    <div key={aviso.id} className={`p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${isUnread ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">
                                                {aviso.mensaje.split(' (Grupo ')[0].replace('El alumno', '').trim()}
                                            </p>
                                            {isUnread && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1" />}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                                G. {aviso.mensaje.split('(Grupo ')[1]?.split(')')[0]}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {aviso.fecha ? aviso.fecha.substring(0,10) : ''}
                                            </span>
                                        </div>
                                        {aviso.motivo && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2">
                                                "{aviso.motivo}"
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-center transition-colors border-2 border-white/20 sm:w-14 sm:h-14 ${hasUnread ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-600 text-slate-100 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                title="Ver alumnos dados de baja"
            >
                <Icon name="user-minus" className="w-5 h-5 sm:w-6 sm:h-6" />
                {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-orange-600 rounded-full border-2 border-orange-500 flex items-center justify-center text-[9px] font-bold">
                        {avisos.filter(a => !localStorage.getItem('aviso_visto_' + a.id)).length}
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default BajasDropdown;
