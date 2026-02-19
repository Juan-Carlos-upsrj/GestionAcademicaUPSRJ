import React, { useState, useEffect, useContext } from 'react';
import Modal from './common/Modal';
import Button from './common/Button';
import Icon from './icons/Icon';
import { AppContext } from '../context/AppContext';
import { Group } from '../types';

interface ClassroomSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group;
    onImport: (assignments: any[]) => void;
}

interface CourseWork {
    id: string;
    title: string;
    description?: string;
    maxPoints?: number;
    creationTime: string;
    updateTime: string;
    dueDate?: { year: number; month: number; day: number };
}

const ClassroomSyncModal: React.FC<ClassroomSyncModalProps> = ({ isOpen, onClose, group, onImport }) => {
    const { state, dispatch } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [courseWork, setCourseWork] = useState<CourseWork[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Configuration for import
    const [targetPartial, setTargetPartial] = useState<1 | 2>(1);
    const [targetTypeId, setTargetTypeId] = useState<string>('');

    // Fetch CourseWork when modal opens
    useEffect(() => {
        if (isOpen && group.classroomCourseId) {
            fetchCourseWork();
        }
    }, [isOpen, group.classroomCourseId]);

    // Select default evaluation type if available
    useEffect(() => {
        if (group.evaluationTypes.partial1.length > 0 && !targetTypeId) {
            setTargetTypeId(group.evaluationTypes.partial1[0].id);
        }
    }, [group.evaluationTypes, targetTypeId]);

    const fetchCourseWork = async () => {
        if (!group.classroomCourseId) return;

        setLoading(true);
        setError(null);
        try {
            const userTokens = state.currentUser?.tokens; // Use full tokens object
            // @ts-ignore
            const work = await window.electronAPI.listCourseWork(userTokens, group.classroomCourseId);

            // Filter out work that is already imported
            const allEvaluations = state.evaluations[group.id] || [];
            const importedIds = new Set(allEvaluations.map(e => e.classroomCourseWorkId).filter(Boolean));

            const newWork = work.filter((w: CourseWork) => !importedIds.has(w.id));
            setCourseWork(newWork);
        } catch (err: any) {
            console.error(err);
            setError('Error al obtener tareas de Classroom. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleImport = () => {
        if (selectedIds.length === 0) return;
        if (!targetTypeId) {
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Selecciona un tipo de evaluación (Examen, Tarea, etc.)', type: 'error' } });
            return;
        }

        const selectedWork = courseWork.filter(w => selectedIds.includes(w.id));

        // Transform to partial import format
        const importData = selectedWork.map(w => ({
            name: w.title,
            maxScore: w.maxPoints || 100,
            partial: targetPartial,
            typeId: targetTypeId,
            classroomCourseWorkId: w.id
        }));

        onImport(importData);
        onClose();
        setSelectedIds([]);
    };

    const currentPartialTypes = targetPartial === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar desde Google Classroom" size="lg">
            <div className="space-y-4">
                {!group.classroomCourseId ? (
                    <div className="text-center p-8 text-slate-500">
                        <Icon name="alert-circle" className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>Este grupo no está vinculado a ningún curso de Classroom.</p>
                        <p className="text-xs mt-1">Ve a configuración del grupo para vincularlo.</p>
                    </div>
                ) : (
                    <>
                        {/* Configurar Importación */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parcial</label>
                                <select
                                    className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                                    value={targetPartial}
                                    onChange={(e) => {
                                        setTargetPartial(Number(e.target.value) as 1 | 2);
                                        // Reset type if not valid for new partial, but usually types are consistent or we default to first
                                        const newTypes = Number(e.target.value) === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2;
                                        if (newTypes.length > 0) setTargetTypeId(newTypes[0].id);
                                    }}
                                >
                                    <option value={1}>Primer Parcial</option>
                                    <option value={2}>Segundo Parcial</option>
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Evaluación</label>
                                <select
                                    className="w-full p-2 rounded-lg border border-slate-300 text-sm"
                                    value={targetTypeId}
                                    onChange={(e) => setTargetTypeId(e.target.value)}
                                >
                                    {currentPartialTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.weight}%)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Lista de Tareas */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] flex flex-col">
                            <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-700">Tareas Disponibles</h3>
                                <div className="text-xs text-slate-500">
                                    {selectedIds.length} seleccionadas
                                </div>
                            </div>

                            <div className="overflow-y-auto p-2 space-y-2 flex-1 custom-scrollbar">
                                {loading ? (
                                    <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                                ) : error ? (
                                    <div className="text-red-500 p-4 text-center text-sm">{error}</div>
                                ) : courseWork.length === 0 ? (
                                    <div className="text-slate-400 p-8 text-center text-sm">No hay tareas nuevas para importar.</div>
                                ) : (
                                    courseWork.map(work => (
                                        <label key={work.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedIds.includes(work.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                                            <input
                                                type="checkbox"
                                                className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={selectedIds.includes(work.id)}
                                                onChange={() => handleToggleSelect(work.id)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-800 text-sm">{work.title}</div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Max: {work.maxPoints || 100} pts</span>
                                                    {work.dueDate && (
                                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Icon name="calendar" className="w-3 h-3" />
                                                            {work.dueDate.day}/{work.dueDate.month}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button onClick={handleImport} disabled={selectedIds.length === 0}>
                                Importar ({selectedIds.length})
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ClassroomSyncModal;