import { useEffect, useState, useContext } from 'react';
import Modal from './Modal';
import Icon from '../icons/Icon';
import { useSettings } from '../../context/SettingsContext';
import { AppContext } from '../../context/AppContext';
import { SYSTEM_API_URL, SYSTEM_API_KEY } from '../../constants';

export interface AvisoBaja {
    id: string;
    titulo: string;
    mensaje: string;
    fecha: string;
    motivo: string;
}

const AvisosBajas = () => {
    const { settings } = useSettings();
    const { state, dispatch } = useContext(AppContext);
    const [avisosCentrales, setAvisosCentrales] = useState<AvisoBaja[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const activeApiUrl = settings.apiUrl && settings.apiUrl.trim() !== '' ? settings.apiUrl : SYSTEM_API_URL;
        const activeApiKey = settings.apiKey && settings.apiKey.trim() !== '' ? settings.apiKey : SYSTEM_API_KEY;
        const careerToUse = state.currentUser?.careerId || 'IAEV';
        
        if (!activeApiUrl || !settings.professorName || settings.professorName === 'Nombre del Profesor') return;

        const checkAvisos = async () => {
            try {
                const response = await fetch(activeApiUrl, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-API-KEY': activeApiKey,
                        'X-CARRERA': careerToUse
                    },
                    body: JSON.stringify({
                        action: 'get-avisos',
                        profesor_nombre: settings.professorName,
                        carrera: careerToUse
                    })
                });
                
                const res = await response.json();
                if (res.status === 'success' && res.data && res.data.length > 0) {
                    const avisosNuevosCentrales: AvisoBaja[] = [];
                    const avisosData = res.data as AvisoBaja[];
                    
                    avisosData.forEach(aviso => {
                        const localStorageKey = 'aviso_visto_' + aviso.id;
                        if (!localStorage.getItem(localStorageKey)) {
                            avisosNuevosCentrales.push(aviso);
                        }
                    });

                    if (avisosNuevosCentrales.length > 0) {
                        setAvisosCentrales(avisosNuevosCentrales);
                        setIsModalOpen(true);
                        
                        // Si son pocos, también mostramos Toast para asegurar visibilidad
                        if (avisosNuevosCentrales.length <= 3) {
                            avisosNuevosCentrales.forEach(a => {
                                dispatch({
                                    type: 'ADD_TOAST',
                                    payload: { message: a.mensaje, type: 'info' }
                                });
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Error obteniendo avisos de baja:", err);
            }
        };

        // Check after 2 seconds of loading MainLayout
        const timer = setTimeout(checkAvisos, 2000);
        
        // Also check every 30 mins
        const interval = setInterval(checkAvisos, 30 * 60 * 1000);
        
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [settings.apiUrl, settings.professorName, state.currentUser?.careerId, dispatch]);

    const handleMarcarVistos = () => {
        avisosCentrales.forEach(aviso => {
            localStorage.setItem('aviso_visto_' + aviso.id, 'true');
        });
        setIsModalOpen(false);
        setAvisosCentrales([]);
    };

    if (avisosCentrales.length === 0) return null;

    return (
        <Modal 
            isOpen={isModalOpen} 
            onClose={handleMarcarVistos} 
            title="Avisos Importantes de Coordinación" 
            size="2xl"
        >
            <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-2xl flex gap-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300 rounded-full flex items-center justify-center shrink-0">
                        <Icon name="alert-triangle" className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-orange-800 dark:text-orange-200">Alumnos Dados de Baja Recientemente</h4>
                        <p className="text-sm text-orange-600 dark:text-orange-300/80 mt-1">
                            Los siguientes alumnos que forman parte de tus grupos han sido marcados como baja en el sistema. 
                            Ya no es necesario que registres su asistencia ni calificaciones.
                        </p>
                    </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {avisosCentrales.map(aviso => (
                        <div key={aviso.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4">
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/50">
                                <Icon name="user-minus" className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h5 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                                    {aviso.mensaje.split(' (Grupo ')[0].replace('El alumno', '').trim()}
                                </h5>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                        Grupo {aviso.mensaje.split('(Grupo ')[1]?.split(')')[0]}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        Fecha: {aviso.fecha ? aviso.fecha.substring(0,10) : 'N/A'}
                                    </span>
                                </div>
                                <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                        "{aviso.motivo || 'Motivo no especificado por coordinación'}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <button 
                        onClick={handleMarcarVistos}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all flex items-center gap-2"
                    >
                        <Icon name="check" className="w-5 h-5" />
                        Entendido, no volver a mostrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AvisosBajas;
