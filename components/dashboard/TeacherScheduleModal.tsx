import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { TeacherClass, DayOfWeek } from '../../types';
import Icon from '../icons/Icon';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { DAYS_OF_WEEK } from '../../constants';
import { v4 as uuidv4 } from 'uuid';

const TeacherScheduleModal: React.FC<{ schedule: TeacherClass[], isOpen: boolean, onClose: () => void }> = ({ schedule, isOpen, onClose }) => {
    const { state, dispatch } = useContext(AppContext);
    const { groups } = state;
    const [isEditing, setIsEditing] = useState(false);

    // Formulario para nueva clase manual (full custom)
    const [newCustomClass, setNewCustomClass] = useState<Partial<TeacherClass>>({
        day: 'Lunes',
        startTime: 7,
        duration: 2,
        subjectName: '',
        groupName: ''
    });

    const formatTime = (hour: number) => {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        return `${h}:${m === 0 ? '00' : m}`;
    };

    const scheduleByDay = useMemo(() => {
        const map: Record<string, (TeacherClass | { isFixedBreak: boolean; startTime: number; duration: number; label: string; id: string })[]> = {};
        DAYS_OF_WEEK.forEach(d => map[d] = []);

        schedule.forEach(c => map[c.day]?.push(c));

        // Agregar recesos fijos si el día tiene clases
        Object.keys(map).forEach(day => {
            if (map[day].length > 0) {
                // Receso Mañana: 8:45 a 9:15 (8.75 a 9.25)
                map[day].push({
                    id: `fixed-break-morning-${day}`,
                    isFixedBreak: true,
                    startTime: 8.75,
                    duration: 0.5,
                    label: "Receso Comidita (Mañana)"
                });
                // Receso Tarde: 15:45 a 16:15 (15.75 a 16.25)
                map[day].push({
                    id: `fixed-break-afternoon-${day}`,
                    isFixedBreak: true,
                    startTime: 15.75,
                    duration: 0.5,
                    label: "Receso Comidita (Tarde)"
                });
            }
            map[day].sort((a, b) => a.startTime - b.startTime);
        });

        return map;
    }, [schedule]);

    // Calcular sesiones de grupos que no tienen hora asignada aún
    const unassignedGroupSessions = useMemo(() => {
        const sessions: { groupId: string, groupName: string, subject: string, day: DayOfWeek }[] = [];
        groups.forEach(g => {
            g.classDays.forEach(day => {
                // Verificar si ya existe una entrada en el horario para este grupo y este día
                const exists = schedule.some(c => c.groupName === g.name && c.subjectName === g.subject && c.day === day);
                if (!exists) {
                    sessions.push({ groupId: g.id, groupName: g.name, subject: g.subject, day });
                }
            });
        });
        return sessions;
    }, [groups, schedule]);

    const handleAddManualClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomClass.subjectName || !newCustomClass.groupName) return;

        const completeClass: TeacherClass = {
            id: uuidv4(),
            day: (newCustomClass.day as DayOfWeek) || 'Lunes',
            startTime: Number(newCustomClass.startTime) || 7,
            duration: Number(newCustomClass.duration) || 1,
            subjectName: newCustomClass.subjectName,
            groupName: newCustomClass.groupName
        };

        dispatch({ type: 'SET_TEACHER_SCHEDULE', payload: [...schedule, completeClass] });
        setNewCustomClass({ ...newCustomClass, subjectName: '', groupName: '' });
    };

    const handleQuickAdd = (session: typeof unassignedGroupSessions[0], startTime: number, duration: number) => {
        const completeClass: TeacherClass = {
            id: uuidv4(),
            day: session.day,
            startTime,
            duration,
            subjectName: session.subject,
            groupName: session.groupName
        };
        dispatch({ type: 'SET_TEACHER_SCHEDULE', payload: [...schedule, completeClass] });
    };

    const handleDeleteClass = (id: string) => {
        dispatch({ type: 'SET_TEACHER_SCHEDULE', payload: schedule.filter(c => c.id !== id) });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Mi Horario Docente"
            size="xl"
            footer={
                <div className="flex justify-between w-full">
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        <Icon name={isEditing ? "calendar" : "settings"} className="w-4 h-4" />
                        {isEditing ? "Ver Horario" : "Gestionar Clases / Horas"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
                </div>
            }
        >
            <div className="space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2">

                {isEditing && (
                    <div className="space-y-6">
                        {/* SECCIÓN 1: ASIGNACIÓN RÁPIDA */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100"
                        >
                            <h4 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
                                <Icon name="list-checks" className="w-4 h-4" /> Sesiones de Grupos Pendientes de Hora
                            </h4>
                            {unassignedGroupSessions.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {unassignedGroupSessions.map((session, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                            <div className="flex-1 min-w-0 text-center sm:text-left">
                                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{session.day}</p>
                                                <p className="font-bold text-sm truncate">{session.groupName}</p>
                                                <p className="text-[10px] text-text-secondary truncate">{session.subject}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="flex flex-col">
                                                    <label className="text-[8px] font-bold uppercase text-slate-400">Inicio</label>
                                                    <input
                                                        type="number" min="7" max="22" defaultValue="7"
                                                        id={`start-${idx}`}
                                                        className="w-16 p-1 text-xs border border-slate-200 rounded bg-slate-50"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <label className="text-[8px] font-bold uppercase text-slate-400">Horas</label>
                                                    <input
                                                        type="number" min="1" max="5" defaultValue="2"
                                                        id={`dur-${idx}`}
                                                        className="w-12 p-1 text-xs border border-slate-200 rounded bg-slate-50"
                                                    />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="!py-1.5 !px-2 mt-2"
                                                    onClick={() => {
                                                        const s = parseInt((document.getElementById(`start-${idx}`) as HTMLInputElement).value);
                                                        const d = parseInt((document.getElementById(`dur-${idx}`) as HTMLInputElement).value);
                                                        handleQuickAdd(session, s, d);
                                                    }}
                                                >
                                                    <Icon name="plus" className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-indigo-400 italic text-center py-2">Todos tus grupos ya tienen sus horas asignadas.</p>
                            )}
                        </motion.div>

                        {/* SECCIÓN 2: AGREGAR MANUAL */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-slate-50 p-4 rounded-xl border border-slate-200"
                        >
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Icon name="plus" className="w-4 h-4" /> Agregar Actividad Extra (Juntas, Asesorías, etc.)
                            </h4>
                            <form onSubmit={handleAddManualClass} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                <div className="sm:col-span-4">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Día</label>
                                    <select
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white"
                                        value={newCustomClass.day}
                                        onChange={e => setNewCustomClass({ ...newCustomClass, day: e.target.value as DayOfWeek })}
                                    >
                                        {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-4">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Inicio (Hora)</label>
                                    <input
                                        type="number" min="7" max="22"
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white"
                                        value={newCustomClass.startTime}
                                        onChange={e => setNewCustomClass({ ...newCustomClass, startTime: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="sm:col-span-4">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Duración</label>
                                    <input
                                        type="number" min="1" max="5"
                                        className="w-full p-2 text-sm border border-border-color rounded-lg bg-white"
                                        value={newCustomClass.duration}
                                        onChange={e => setNewCustomClass({ ...newCustomClass, duration: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="sm:col-span-5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Actividad / Materia</label>
                                    <input
                                        type="text" placeholder="Ej. Reunión Academia"
                                        className="w-full p-2 text-sm border border-border-color rounded-md bg-surface"
                                        value={newCustomClass.subjectName}
                                        onChange={e => setNewCustomClass({ ...newCustomClass, subjectName: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-5">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Lugar / Grupo</label>
                                    <input
                                        type="text" placeholder="Ej. Sala A"
                                        className="w-full p-2 text-sm border border-border-color rounded-md bg-surface"
                                        value={newCustomClass.groupName}
                                        onChange={e => setNewCustomClass({ ...newCustomClass, groupName: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2 flex items-end">
                                    <Button type="submit" size="sm" className="w-full !py-2.5">Añadir</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {DAYS_OF_WEEK.map(day => {
                        const items = scheduleByDay[day];
                        if (items.length === 0) return null;

                        return (
                            <motion.div
                                layout
                                key={day}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-2"
                            >
                                <h4 className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block">{day}</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {items.map((item, i) => {
                                        // Detección de receso académico entre clases
                                        const nextItem = items[i + 1];
                                        const hasAcademicRecess = nextItem && (nextItem.startTime > item.startTime + item.duration);

                                        if ('isFixedBreak' in item) {
                                            return (
                                                <div key={item.id} className="flex items-center gap-4 bg-rose-50/50 border border-rose-100 p-2 rounded-xl border-dashed">
                                                    <div className="bg-rose-100 p-1.5 rounded-lg text-center min-w-[70px]">
                                                        <p className="text-[8px] font-bold text-rose-500 uppercase">Hora</p>
                                                        <p className="text-xs font-bold text-rose-600">{formatTime(item.startTime)}</p>
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                                        <Icon name="cake" className="w-4 h-4 text-rose-500" />
                                                        <p className="font-bold text-xs text-rose-700 uppercase tracking-tight">{item.label}</p>
                                                    </div>
                                                    <div className="text-right pr-2">
                                                        <p className="text-[8px] font-bold text-rose-400 uppercase">Fin</p>
                                                        <p className="text-xs font-bold text-rose-500">{formatTime(item.startTime + item.duration)}</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const c = item as TeacherClass;
                                        return (
                                            <React.Fragment key={c.id}>
                                                <div className="flex items-center gap-4 bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-primary transition-colors group">
                                                    <div className="bg-slate-100 p-2 rounded-lg text-center min-w-[70px]">
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Inicio</p>
                                                        <p className="text-sm font-bold text-primary">{formatTime(c.startTime)}</p>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate">{c.subjectName}</p>
                                                        <p className="text-xs text-text-secondary truncate">{c.groupName}</p>
                                                    </div>
                                                    <div className="text-right flex items-center gap-3">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Fin</p>
                                                            <p className="text-xs font-bold text-slate-600">{formatTime(c.startTime + c.duration)}</p>
                                                        </div>
                                                        {isEditing && (
                                                            <button
                                                                onClick={() => handleDeleteClass(c.id)}
                                                                className="p-2 text-slate-300 hover:text-accent-red hover:bg-rose-50 rounded-lg transition-all"
                                                            >
                                                                <Icon name="trash-2" className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {hasAcademicRecess && !isEditing && (
                                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50/50 border border-dashed border-amber-200 rounded-lg text-amber-700">
                                                        <Icon name="cake" className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Receso Académico</span>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {schedule.length === 0 && !isEditing && (
                    <div className="text-center py-10 opacity-40">
                        <Icon name="calendar" className="w-16 h-16 mx-auto mb-2" />
                        <p>No hay horario cargado. Pulsa el botón "Horario" en el Dashboard para sincronizar o usa el modo gestión para añadir clases manualmente.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default TeacherScheduleModal;
