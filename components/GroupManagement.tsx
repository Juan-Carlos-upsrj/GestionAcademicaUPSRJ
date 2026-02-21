import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Group, DayOfWeek, EvaluationType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Modal from './common/Modal';
import Button from './common/Button';
import Icon from './icons/Icon';
import ConfirmationModal from './common/ConfirmationModal';
import { DAYS_OF_WEEK, GROUP_COLORS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import StudentManagementPanel from './StudentManagementPanel';
import ClassroomSelector from './ClassroomSelector';

// --- COMPONENTE: EDITOR DE CRITERIOS ---
const EvaluationTypesEditor: React.FC<{
    types: EvaluationType[];
    onTypesChange: (types: EvaluationType[]) => void;
    partialName: string;
}> = ({ types, onTypesChange, partialName }) => {
    const totalWeight = useMemo(() => types.reduce((sum, type) => sum + (Number(type.weight) || 0), 0), [types]);

    const handleTypeChange = (id: string, field: 'name' | 'weight', value: string) => {
        onTypesChange(types.map(type =>
            type.id === id ? { ...type, [field]: field === 'weight' ? Number(value) : value } : type
        ));
    };

    const addType = () => onTypesChange([...types, { id: uuidv4(), name: '', weight: 0 }]);
    const removeType = (id: string) => onTypesChange(types.filter(type => type.id !== id));

    return (
        <fieldset className="border-2 p-4 rounded-2xl border-slate-100 bg-slate-50/50">
            <legend className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{partialName}</legend>
            <div className="space-y-3 mt-2">
                {types.map(type => (
                    <div key={type.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-7">
                            <input
                                type="text"
                                placeholder="Ej. Examen"
                                value={type.name}
                                onChange={e => handleTypeChange(type.id, 'name', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="col-span-3 relative">
                            <input
                                type="number"
                                value={type.weight}
                                onChange={e => handleTypeChange(type.id, 'weight', e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-xl bg-white text-xs font-black pr-6 text-center outline-none"
                                min="0"
                                max="100"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">%</span>
                        </div>
                        <div className="col-span-1 flex justify-center">
                            <button
                                type="button"
                                onClick={() => {
                                    const newValue = !type.isAttendance;
                                    onTypesChange(types.map(t =>
                                        t.id === type.id ? { ...t, isAttendance: newValue, name: newValue ? 'Asistencia' : t.name } : t
                                    ));
                                }}
                                className={`p-1.5 rounded-lg transition-colors ${type.isAttendance ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300 hover:text-emerald-500'}`}
                                title={type.isAttendance ? "Es Asistencia (Automático)" : "Marcar como Asistencia"}
                            >
                                <Icon name="check-square" className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeType(type.id)}
                            className="col-span-1 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                            <Icon name="trash-2" className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200/60">
                <button
                    type="button"
                    onClick={addType}
                    className="flex items-center gap-1.5 text-[10px] font-black text-primary hover:text-primary-hover uppercase tracking-wider transition-colors"
                >
                    <Icon name="plus" className="w-3 h-3" /> Añadir Criterio
                </button>
                <div className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${totalWeight !== 100 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    Suma: {totalWeight}%
                </div>
            </div>
        </fieldset>
    );
};

// --- COMPONENTE: FORMULARIO DE GRUPO ---
export const GroupForm: React.FC<{
    group?: Group;
    onSave: (group: Group) => void;
    onCancel: () => void;
}> = ({ group, onSave, onCancel }) => {
    // const { dispatch } = useContext(AppContext); // Removed unused dispatch
    const [name, setName] = useState(group?.name || '');
    const [subject, setSubject] = useState(group?.subject || '');
    const [subjectShortName, setSubjectShortName] = useState(group?.subjectShortName || '');
    const [quarter, setQuarter] = useState(group?.quarter || '');
    const [classDays, setClassDays] = useState<DayOfWeek[]>(group?.classDays || []);
    const [color, setColor] = useState(group?.color || GROUP_COLORS[0].name);

    // Configuración de evaluaciones
    const [p1Types, setP1Types] = useState<EvaluationType[]>(
        group?.evaluationTypes?.partial1 || [{ id: uuidv4(), name: 'General', weight: 100 }]
    );
    const [p2Types, setP2Types] = useState<EvaluationType[]>(
        group?.evaluationTypes?.partial2 || [{ id: uuidv4(), name: 'General', weight: 100 }]
    );
    const [classroomCourseId, setClassroomCourseId] = useState<string | undefined>(group?.classroomCourseId);
    const [showClassroomSelector, setShowClassroomSelector] = useState(false);

    // Access tokens from context (need to pass them down or access context here)
    const { state } = useContext(AppContext);
    const userTokens = state.currentUser?.tokens;
    // Actually User interface has tokens?: any.

    const handleDayToggle = (day: DayOfWeek) => {
        setClassDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const isTotalValid = (types: EvaluationType[]) =>
        types.reduce((s, t) => s + (Number(t.weight) || 0), 0) === 100;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isTotalValid(p1Types)) return alert('La suma del P1 debe ser 100%');
        if (!isTotalValid(p2Types)) return alert('La suma del P2 debe ser 100%');

        onSave({
            id: group?.id || uuidv4(),
            name: name.toUpperCase(),
            subject,
            subjectShortName: subjectShortName.trim().toUpperCase() || undefined,
            quarter,
            classDays,
            students: group?.students || [],
            color,
            evaluationTypes: { partial1: p1Types, partial2: p2Types },
            classroomCourseId
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SECCIÓN IZQUIERDA: DATOS BÁSICOS */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Icon name="layout" className="w-5 h-5 text-primary" />
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Información General</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Nombre Grupo</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. 6A" required className="w-full p-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary font-bold uppercase transition-all outline-none" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Cuatrimestre</label>
                            <input type="text" value={quarter} onChange={e => setQuarter(e.target.value)} placeholder="Ej. 5º" className="w-full p-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary font-bold text-center transition-all outline-none" />
                        </div>
                    </div>

                    {/* CLASSROOM LINK */}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Vinculación Google Classroom</label>
                        {classroomCourseId ? (
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <Icon name="check-circle" className="w-5 h-5 text-emerald-500" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[10px] font-black uppercase text-emerald-700 truncate">Curso Vinculado</p>
                                    <p className="text-[9px] font-bold text-emerald-500 truncate">ID: {classroomCourseId}</p>
                                </div>
                                <button type="button" onClick={() => setClassroomCourseId(undefined)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Icon name="trash-2" className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowClassroomSelector(true)}
                                className="w-full !justify-start gap-2 border-dashed border-2 hover:border-primary/50 text-xs"
                                disabled={!userTokens} // Disable if no google session
                            >
                                <Icon name="link" className="w-4 h-4" />
                                {userTokens ? 'Vincular con Classroom' : 'Inicia sesión con Google para vincular'}
                            </Button>
                        )}

                        <Modal
                            isOpen={showClassroomSelector}
                            onClose={() => setShowClassroomSelector(false)}
                            title="Selecciona un Curso de Classroom"
                            size="2xl"
                        >
                            <ClassroomSelector
                                tokens={userTokens}
                                onSelect={(course) => {
                                    setClassroomCourseId(course.id);
                                    setShowClassroomSelector(false);
                                }}
                                onCancel={() => setShowClassroomSelector(false)}
                                currentLinkedId={classroomCourseId}
                            />
                        </Modal>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Materia Completa</label>
                        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ej. Introducción a la Programación" required className="w-full p-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary font-bold transition-all outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 ml-1">Abrev. (3-5 letras)</label>
                        <input type="text" value={subjectShortName} onChange={e => setSubjectShortName(e.target.value)} maxLength={5} placeholder="Ej. PROG" className="w-full p-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary font-black uppercase text-center transition-all outline-none" />
                    </div>
                </div>

                {/* SECCIÓN DERECHA: CONFIGURACIÓN VISUAL Y DÍAS */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Icon name="calendar" className="w-5 h-5 text-primary" />
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Días de Clase</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 py-2">
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                type="button"
                                key={day}
                                onClick={() => handleDayToggle(day)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${classDays.includes(day) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                            >
                                {day.substring(0, 3).toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 pt-2">
                        <Icon name="settings" className="w-5 h-5 text-primary" />
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Identificador Visual</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {GROUP_COLORS.map(c => (
                            <button
                                type="button"
                                key={c.name}
                                onClick={() => setColor(c.name)}
                                className={`w-9 h-9 rounded-2xl ${c.bg} transition-all hover:scale-110 shadow-sm ${color === c.name ? 'ring-4 ring-offset-2 ring-primary/30 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* SECCIÓN INFERIOR: ESQUEMA DE EVALUACIÓN */}
            <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Icon name="bar-chart-3" className="w-5 h-5 text-primary" />
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Esquema de Evaluación (Ponderación)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EvaluationTypesEditor types={p1Types} onTypesChange={setP1Types} partialName="Primer Parcial" />
                    <EvaluationTypesEditor types={p2Types} onTypesChange={setP2Types} partialName="Segundo Parcial" />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={onCancel} className="!rounded-2xl">Cancelar</Button>
                <Button
                    type="submit"
                    className="shadow-xl shadow-primary/20 !rounded-2xl px-8"
                    disabled={!isTotalValid(p1Types) || !isTotalValid(p2Types)}
                >
                    <Icon name="check-circle-2" className="w-5 h-5" />
                    {group ? 'Guardar Cambios' : 'Crear Grupo'}
                </Button>
            </div>
        </form>
    );
};

// --- COMPONENTE PRINCIPAL ---
const GroupManagement: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, selectedGroupId } = state;

    // Local state for search
    const [searchTerm, setSearchTerm] = useState('');

    // Derived state for filtered groups
    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return groups;
        const lowerTerm = searchTerm.toLowerCase();
        return groups.filter(g =>
            g.name.toLowerCase().includes(lowerTerm) ||
            g.subject.toLowerCase().includes(lowerTerm) ||
            g.subjectShortName?.toLowerCase().includes(lowerTerm) ||
            // Enhanced search: check students
            g.students.some(s =>
                s.name.toLowerCase().includes(lowerTerm) ||
                s.nickname?.toLowerCase().includes(lowerTerm) ||
                s.team?.toLowerCase().includes(lowerTerm) ||
                s.teamCoyote?.toLowerCase().includes(lowerTerm)
            )
        );
    }, [groups, searchTerm]);

    // Derived state for the selected group
    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined);
    const [confirmDelete, setConfirmDelete] = useState<Group | null>(null);

    const handleSaveGroup = (g: Group) => {
        dispatch({ type: 'SAVE_GROUP', payload: g });
        setIsModalOpen(false);
        dispatch({
            type: 'ADD_TOAST', payload: {
                message: `Grupo ${g.name} ${editingGroup ? 'actualizado' : 'registrado'} con éxito.`,
                type: 'success'
            }
        });
    };

    const handleDelete = () => {
        if (confirmDelete) {
            dispatch({ type: 'DELETE_GROUP', payload: confirmDelete.id });
            setConfirmDelete(null);
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Grupo eliminado permanentemente.', type: 'info' } });

            // If the deleted group was selected, deselect it
            if (selectedGroupId === confirmDelete.id) {
                dispatch({ type: 'SET_SELECTED_GROUP', payload: null });
            }
        }
    };

    const handleSelectGroup = (groupId: string) => {
        // Toggle selection or select new
        const newId = selectedGroupId === groupId ? null : groupId;
        dispatch({ type: 'SET_SELECTED_GROUP', payload: newId });
    };

    return (
        <div className="max-w-[1920px] mx-auto h-full flex flex-col pl-4 sm:pl-8 pr-8 md:pr-16 lg:pr-20 py-6 overflow-hidden">
            {/* CABECERA DE SECCIÓN COMPACTA */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/40 backdrop-blur-xl p-4 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/20 mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-white rounded-[1rem] flex items-center justify-center shadow-lg shadow-primary/30">
                        <Icon name="users" className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gestión Académica</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{groups.length} Grupos Configurados</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar alumno, equipo, grupo..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-white shadow-sm text-sm font-bold text-slate-600 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setEditingGroup(undefined); setIsModalOpen(true); }} className="!rounded-xl !py-2.5 shadow-lg shadow-primary/20">
                        <Icon name="plus" className="w-4 h-4 mr-1" />
                        Nuevo Grupo
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT AREA - VERTICAL STACK LAYOUT */}
            <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden">

                {/* TOP SECTION: HORIZONTAL GROUPS LIST */}
                <div className="w-full shrink-0 overflow-x-auto custom-scrollbar pb-4">
                    <div className="w-max min-w-full flex gap-4 py-2">
                        <AnimatePresence mode="popLayout">
                            {filteredGroups.map((g, idx) => {
                                const colorObj = GROUP_COLORS.find(c => c.name === g.color) || GROUP_COLORS[0];
                                const isSelected = selectedGroupId === g.id;

                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.03 }}
                                        key={g.id}
                                        onClick={() => handleSelectGroup(g.id)}
                                        className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden bg-white hover:shadow-md border-l-4 w-[280px] shrink-0 ${isSelected
                                            ? `bg-slate-50 shadow-lg scale-[1.02] z-10`
                                            : `border-y border-r border-slate-100/50 hover:border-r-slate-200`
                                            }`}
                                        style={{
                                            borderLeftColor: colorObj.hex,
                                            boxShadow: isSelected ? `0 10px 15px -3px ${colorObj.hex}20, 0 4px 6px -2px ${colorObj.hex}10` : undefined
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <h3
                                                    className="font-black text-sm uppercase leading-tight"
                                                    style={{ color: isSelected || true ? colorObj.hex : undefined }}
                                                >
                                                    {g.name}
                                                </h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate max-w-[150px]">{g.subjectShortName || g.subject}</p>
                                            </div>

                                            {/* Action Buttons (Visible on hover or selection) */}
                                            <div className={`flex gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingGroup(g); setIsModalOpen(true); }}
                                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-md transition-all"
                                                >
                                                    <Icon name="settings" className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex -space-x-1">
                                                {/* Mini Day Indicators */}
                                                {['L', 'M', 'X', 'J', 'V', 'S'].map(d => {
                                                    const dayName = DAYS_OF_WEEK.find(dw => dw.startsWith(d === 'X' ? 'Mi' : d === 'L' ? 'Lu' : d === 'M' ? 'Ma' : d === 'J' ? 'Ju' : d === 'V' ? 'Vi' : 'Sá'));
                                                    const isActive = g.classDays.includes(dayName as DayOfWeek);
                                                    if (!isActive) return null;
                                                    return (
                                                        <span key={d} className="w-4 h-4 rounded-full bg-slate-100 text-[8px] font-black text-slate-500 flex items-center justify-center ring-1 ring-white">
                                                            {d}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                                                {g.students.length} Alumnos
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* ESTADO VACÍO */}
                        {filteredGroups.length === 0 && (
                            <div className="w-[280px] shrink-0 py-8 flex flex-col items-center justify-center bg-white/40 rounded-[2rem] border-4 border-dashed border-white/60">
                                <div className="w-12 h-12 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center mb-2 shadow-inner">
                                    <Icon name={searchTerm ? "search" : "users"} className="w-6 h-6" />
                                </div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">{searchTerm ? 'No hay resultados' : 'Sin Grupos'}</h3>
                                {!searchTerm && <Button onClick={() => setIsModalOpen(true)} className="mt-3 !rounded-lg px-4 text-[10px]">Crear Grupo</Button>}
                            </div>
                        )}

                        {/* SPACER FORZADO PARA OVERFLOW-X EN FLEXBOX */}
                        <div className="w-16 md:w-32 shrink-0"></div>
                    </div>
                </div>

                {/* BOTTOM SECTION: STUDENT MANAGEMENT PANEL */}
                <AnimatePresence mode="wait">
                    {selectedGroup && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex-1 min-h-0 w-full" // Ensure takes full remaining height
                            key={selectedGroup.id}
                        >
                            <StudentManagementPanel group={selectedGroup} searchTerm={searchTerm} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MODAL DE EDICIÓN/CREACIÓN */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingGroup ? 'Configuración de Grupo' : 'Registro de Nuevo Grupo'}
                size="4xl"
            >
                <GroupForm
                    group={editingGroup}
                    onSave={handleSaveGroup}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* MODAL DE ELIMINACIÓN */}
            <ConfirmationModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                title="Baja de Grupo"
                variant="danger"
                confirmText="Confirmar Baja"
            >
                <div className="space-y-4">
                    <p className="text-sm leading-relaxed">
                        ¿Estás seguro de que deseas eliminar el grupo <strong className="text-rose-600">{confirmDelete?.name}</strong>?
                    </p>
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-700 font-medium italic">
                        "Esta acción borrará permanentemente toda la lista de alumnos, asistencias y calificaciones registradas. Esta operación es irreversible."
                    </div>
                </div>
            </ConfirmationModal>
        </div>
    );
};

export default GroupManagement;