import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { useSettings } from '../../context/SettingsContext';
import { Group } from '../../types';
import Icon from '../icons/Icon';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { fetchTodaySyncStatus } from '../../services/syncService';
import { GROUP_COLORS } from '../../constants';

interface SyncStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SyncStatusModal: React.FC<SyncStatusModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useContext(AppContext);
    const { settings } = useSettings();
    const dayOfWeek = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    
    // Clases programadas para hoy
    const todaysClasses = state.groups.filter(g => 
        g.classDays.some(d => d.toLowerCase() === dayOfWeek.toLowerCase())
    );

    const isSynced = (group: Group) => state.syncedGroupsToday.includes(`${group.name}|${group.subject}`);

    const handleRefresh = () => {
        fetchTodaySyncStatus(settings, dispatch);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Estatus de Sincronización Hoy">
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Docente</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{settings.professorName || 'No configurado'}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleRefresh}>
                        <Icon name="refresh-cw" className="w-3.5 h-3.5 mr-1.5" />
                        Actualizar
                    </Button>
                </div>

                <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-1">Clases del Día ({todaysClasses.length})</p>
                    
                    {todaysClasses.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Icon name="calendar" className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest italic">Sin clases programadas para hoy</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {todaysClasses.map(group => {
                                const synced = isSynced(group);
                                const colorObj = GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0];

                                return (
                                    <div 
                                        key={group.id} 
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center gap-3 shadow-sm"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorObj.bg} ${colorObj.text} shadow-inner`}>
                                            <Icon name="book-open" className="w-5 h-5" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{group.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase truncate">{group.subject}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {synced ? (
                                                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                                                    <Icon name="check-circle" className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">Sincronizado</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-800/50">
                                                    <Icon name="cloud-off" className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">Pendiente</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-800/50">
                    <Icon name="info" className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <p className="text-[10px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                        Esta información se obtiene directamente del servidor central. Si acabas de subir una lista y no aparece como sincronizada, presiona el botón "Actualizar".
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={onClose} variant="secondary">Cerrar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default SyncStatusModal;
