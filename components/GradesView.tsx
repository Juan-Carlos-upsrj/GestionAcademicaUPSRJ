import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import ErrorBoundary from './common/ErrorBoundary';
import { AppContext } from '../context/AppContext';
import { Evaluation } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Icon from './icons/Icon';
import ConfirmationModal from './common/ConfirmationModal';
import { GroupForm } from './GroupManagement';
import GradeImageModal from './GradeImageModal';
import CopyEvaluationsModal from './CopyEvaluationsModal';
import ClassroomSyncModal from './ClassroomSyncModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';

import { useGradesManager, GRADE_REMEDIAL_P1, GRADE_REMEDIAL_P2, GRADE_EXTRA, GRADE_SPECIAL } from '../hooks/useGradesManager';
import EvaluationForm from './grades/EvaluationForm';
import OrdinaryGradesTable from './grades/OrdinaryGradesTable';
import RecoveryGradesTable from './grades/RecoveryGradesTable';

interface Coords { r: number; c: string; } // c es evaluationId

const GradesView: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();

    const {
        selectedGroupId, groups, group,
        viewMode, searchTerm, displayTeamType, settings,
        groupEvaluations, groupGrades, attendance,
        p1Evaluations, p2Evaluations, p1AttendanceType, p2AttendanceType,
        filteredStudents, studentsForRecovery,
        setSelectedGroupId, setViewMode, setSearchTerm, setDisplayTeamType,
        handleGradeChange, handleReorder, deleteEvaluation, saveEvaluation, updateSettings
    } = useGradesManager();

    // Sync URL param with context
    useEffect(() => {
        if (groupId && groupId !== selectedGroupId) {
            setSelectedGroupId(groupId);
        }
    }, [groupId, selectedGroupId, setSelectedGroupId]);

    // Handle dropdown change (navigation)
    const handleGroupChange = (newGroupId: string) => {
        setSelectedGroupId(newGroupId);
        navigate(`/grades/${newGroupId}`);
    };

    const [isEvalModalOpen, setEvalModalOpen] = useState(false);
    const [isGroupConfigOpen, setGroupConfigOpen] = useState(false);
    const [isImageModalOpen, setImageModalOpen] = useState(false);
    const [isCopyModalOpen, setCopyModalOpen] = useState(false);
    const [isSyncModalOpen, setSyncModalOpen] = useState(false);
    const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | undefined>(undefined);
    const [confirmDeleteEval, setConfirmDeleteEval] = useState<Evaluation | null>(null);

    // ESTADOS PARA SELECCIÓN TIPO EXCEL
    const [selection, setSelection] = useState<{ start: Coords | null, end: Coords | null, isDragging: boolean }>({
        start: null, end: null, isDragging: false
    });
    const [bulkGradeValue, setBulkGradeValue] = useState('');
    const [floatingPos, setFloatingPos] = useState({ x: 0, y: 0 });

    const allColumnIds = useMemo(() => {
        if (viewMode === 'recovery') return [GRADE_REMEDIAL_P1, GRADE_REMEDIAL_P2, GRADE_EXTRA, GRADE_SPECIAL];
        return [...p1Evaluations.map(e => e.id), ...p2Evaluations.map(e => e.id)];
    }, [viewMode, p1Evaluations, p2Evaluations]);

    const { state, dispatch } = useContext(AppContext); // Still needed for toasts and other modals

    // LÓGICA DE SELECCIÓN POR ARRASTRE
    const onMouseDown = useCallback((r: number, c: string, e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setSelection({ start: { r, c }, end: { r, c }, isDragging: true });
    }, []);

    const onMouseEnter = useCallback((r: number, c: string) => {
        setSelection(prev => {
            if (prev.isDragging) {
                return { ...prev, end: { r, c } };
            }
            return prev;
        });
    }, []);

    const onMouseUp = useCallback((e: React.MouseEvent) => {
        setSelection(prev => {
            if (prev.isDragging) {
                setFloatingPos({ x: e.clientX, y: e.clientY });
                return { ...prev, isDragging: false };
            }
            return prev;
        });
    }, []);

    const isSelected = useCallback((r: number, cId: string) => {
        if (!selection.start || !selection.end) return false;
        const minR = Math.min(selection.start.r, selection.end.r);
        const maxR = Math.max(selection.start.r, selection.end.r);
        const startCIdx = allColumnIds.indexOf(selection.start.c);
        const endCIdx = allColumnIds.indexOf(selection.end.c);
        if (startCIdx === -1 || endCIdx === -1) return false; // Safety check
        const minC = Math.min(startCIdx, endCIdx);
        const maxC = Math.max(startCIdx, endCIdx);
        const currentCIdx = allColumnIds.indexOf(cId);
        return r >= minR && r <= maxR && currentCIdx >= minC && currentCIdx <= maxC;
    }, [selection, allColumnIds]);

    const handleBulkFill = useCallback(() => {
        if (!selection.start || !selection.end || !selectedGroupId) return;
        const minR = Math.min(selection.start.r, selection.end.r), maxR = Math.max(selection.start.r, selection.end.r);
        const startCIdx = allColumnIds.indexOf(selection.start.c), endCIdx = allColumnIds.indexOf(selection.end.c);
        const minC = Math.min(startCIdx, endCIdx), maxC = Math.max(startCIdx, endCIdx);
        const targetList = viewMode === 'recovery' ? studentsForRecovery : filteredStudents;
        const val = parseFloat(bulkGradeValue);
        const numericValue = bulkGradeValue === '' ? null : Math.max(0, isNaN(val) ? 0 : val);
        let count = 0;
        for (let r = minR; r <= maxR; r++) {
            const student = targetList[r]; if (!student) continue;
            for (let cIdx = minC; cIdx <= maxC; cIdx++) {
                const evalId = allColumnIds[cIdx];
                handleGradeChange(student.id, evalId, numericValue === null ? '' : numericValue.toString());
                count++;
            }
        }
        dispatch({ type: 'ADD_TOAST', payload: { message: `Se actualizaron ${count} celdas.`, type: 'success' } });
        setSelection({ start: null, end: null, isDragging: false }); setBulkGradeValue('');
    }, [selection, selectedGroupId, allColumnIds, viewMode, studentsForRecovery, filteredStudents, bulkGradeValue, handleGradeChange, dispatch]);

    const handlePaste = useCallback((e: React.ClipboardEvent, studentIndex: number, evaluationId: string) => {
        const pasteData = e.clipboardData.getData('text');
        const rows = pasteData.split(/\r?\n/).filter(line => line.trim() !== "");
        if (rows.length > 1 && selectedGroupId) {
            e.preventDefault(); let count = 0;
            const targetList = viewMode === 'recovery' ? studentsForRecovery : filteredStudents;
            rows.forEach((rowValue, offset) => {
                const targetStudent = targetList[studentIndex + offset];
                if (targetStudent) {
                    const cleanValue = rowValue.trim().replace(',', '.');
                    const numericValue = parseFloat(cleanValue);
                    if (!isNaN(numericValue)) {
                        handleGradeChange(targetStudent.id, evaluationId, Math.max(0, numericValue).toString());
                        count++;
                    }
                }
            });
            dispatch({ type: 'ADD_TOAST', payload: { message: `Se pegaron ${count} calificaciones correctamente.`, type: 'success' } });
        }
    }, [selectedGroupId, viewMode, studentsForRecovery, filteredStudents, handleGradeChange, dispatch]);

    const deleteEvaluationAction = () => {
        if (confirmDeleteEval) {
            deleteEvaluation(confirmDeleteEval.id);
            setConfirmDeleteEval(null);
        }
    };

    // Handler for importing assignments
    const handleImportAssignments = (assignments: any[]) => {
        // Create evaluations for each imported assignment
        assignments.forEach(a => {
            const newEval: Evaluation = {
                id: crypto.randomUUID(),
                name: a.name,
                maxScore: a.maxScore,
                partial: a.partial,
                typeId: a.typeId,
                classroomCourseWorkId: a.classroomCourseWorkId
            };
            saveEvaluation(newEval);
        });
        dispatch({ type: 'ADD_TOAST', payload: { message: `Se importaron ${assignments.length} tareas correctamente.`, type: 'success' } });
    };

    // Helper to normalize strings (remove accents, lowercase, remove punctuation)
    const normalize = (str: string) => {
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove diacritics (accents, ~)
            .replace(/[.,()'"-]/g, " ")      // replace punctuation with space
            .replace(/\s+/g, " ")            // normalize spaces
            .trim();
    };

    const checkMatch = (localName: string, classroomName: string) => {
        const local = normalize(localName);
        const classroom = normalize(classroomName);
        if (local === classroom) return true;

        const localTokens = local.split(' ').filter(Boolean);
        const classroomTokens = classroom.split(' ').filter(Boolean);

        // Count how many local tokens exist in the classroom name
        // Use a high threshold, e.g., all tokens of the shorter name must be in the longer name
        const shorter = localTokens.length < classroomTokens.length ? localTokens : classroomTokens;
        const longer = localTokens.length < classroomTokens.length ? classroomTokens : localTokens;

        if (shorter.length < 2) return local === classroom; // Too short to guess

        // Check if all parts of the shorter name are found in the longer name
        const matchCount = shorter.filter(token => longer.includes(token)).length;

        // If it matches all but maybe 1 part (e.g. missing a middle name), consider it a match
        return matchCount >= shorter.length - 1 && matchCount >= 2;
    };

    const fetchStudentMap = async (tokens: any) => {
        // @ts-ignore
        const students = await window.electronAPI.listStudents(tokens, group.classroomCourseId);
        const map = new Map();
        students.forEach((s: any) => {
            if (s.profile && s.profile.name) {
                map.set(s.userId, {
                    fullName: s.profile.name.fullName,
                    email: s.profile.emailAddress
                });
            }
        });
        return map;
    };

    const syncEvaluation = async (ev: Evaluation, studentMap: Map<string, any>, tokens: any) => {
        // @ts-ignore
        const submissions = await window.electronAPI.listSubmissions(tokens, group.classroomCourseId, ev.classroomCourseWorkId);
        let updatedCount = 0;

        filteredStudents.forEach(localStudent => {
            const classroomStudentEntry = [...studentMap.entries()].find(([_, data]) => {
                return checkMatch(localStudent.name, data.fullName);
            });

            if (classroomStudentEntry) {
                const [classroomStudentId] = classroomStudentEntry;
                const submission = submissions.find((s: any) => s.userId === classroomStudentId);

                if (submission && submission.assignedGrade !== undefined && submission.assignedGrade !== null) {
                    handleGradeChange(localStudent.id, ev.id, submission.assignedGrade.toString());
                    updatedCount++;
                }
            }
        });
        return updatedCount;
    };

    const handleSync = async (ev: Evaluation) => {
        if (!group?.classroomCourseId || !ev.classroomCourseWorkId) return;
        const { tokens } = state.currentUser || {};
        if (!tokens) {
            dispatch({ type: 'ADD_TOAST', payload: { message: "No detecto sesión activa con Google.", type: 'error' } });
            return;
        }

        try {
            const studentMap = await fetchStudentMap(tokens);
            const count = await syncEvaluation(ev, studentMap, tokens);

            if (count > 0) {
                dispatch({ type: 'ADD_TOAST', payload: { message: `Se actualizaron ${count} calificaciones.`, type: 'success' } });
            } else {
                dispatch({ type: 'ADD_TOAST', payload: { message: "No se encontraron nuevas calificaciones.", type: 'info' } });
            }
        } catch (error) {
            console.error(error);
            dispatch({ type: 'ADD_TOAST', payload: { message: "Error al sincronizar.", type: 'error' } });
        }
    };

    const handleSyncAll = async () => {
        if (!group?.classroomCourseId) return;
        const { tokens } = state.currentUser || {};
        if (!tokens) {
            dispatch({ type: 'ADD_TOAST', payload: { message: "No detecto sesión activa con Google.", type: 'error' } });
            return;
        }

        const linkedEvaluations = groupEvaluations.filter(ev => ev.classroomCourseWorkId);
        if (linkedEvaluations.length === 0) {
            dispatch({ type: 'ADD_TOAST', payload: { message: "No hay tareas vinculadas a Classroom.", type: 'info' } });
            return;
        }

        try {
            dispatch({ type: 'ADD_TOAST', payload: { message: "Iniciando sincronización masiva...", type: 'info' } });
            const studentMap = await fetchStudentMap(tokens);
            let totalUpdated = 0;

            for (const ev of linkedEvaluations) {
                totalUpdated += await syncEvaluation(ev, studentMap, tokens);
            }

            dispatch({ type: 'ADD_TOAST', payload: { message: `Sincronización completada. Total actualizado: ${totalUpdated}`, type: 'success' } });

        } catch (error) {
            console.error(error);
            dispatch({ type: 'ADD_TOAST', payload: { message: "Error en la sincronización masiva.", type: 'error' } });
        }
    };

    return (
        <ErrorBoundary>
            <div className="flex flex-col h-full overflow-hidden" onMouseUp={onMouseUp}>
                <div className="bg-surface p-3 mb-4 rounded-xl border border-border-color shadow-sm flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <select value={selectedGroupId || ''} onChange={(e) => handleGroupChange(e.target.value)} className="w-full sm:w-56 p-2 border border-border-color rounded-md bg-white text-sm focus:ring-2 focus:ring-primary">
                            <option value="" disabled>Selecciona un grupo</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Icon name="search" className="h-4 w-4" /></div>
                            <input type="text" className="block w-full pl-9 pr-3 py-2 border border-border-color rounded-md bg-white text-sm focus:ring-1 focus:ring-primary" placeholder="Buscar alumno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="bg-surface-secondary p-1 rounded-lg flex border border-border-color">
                            <button onClick={() => setViewMode('ordinary')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${viewMode === 'ordinary' ? 'bg-white shadow text-primary' : 'text-text-secondary'}`}>Ordinario</button>
                            <button onClick={() => setViewMode('recovery')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${viewMode === 'recovery' ? 'bg-amber-100 shadow text-amber-800' : 'text-text-secondary'}`}>Recuperación</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-color pt-3">
                        <div className="flex items-center gap-4">
                            <button onClick={() => updateSettings({ showTeamsInGrades: !settings.showTeamsInGrades })} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${settings.showTeamsInGrades ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-surface border-border-color text-text-secondary'}`}><Icon name="users" className="w-4 h-4" /> Equipos: {settings.showTeamsInGrades ? 'ON' : 'OFF'}</button>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/attendance/${group?.id}`)} className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            <Icon name="check-square" className="w-4 h-4" />
                            <span className="hidden lg:inline ml-1">Pasar Lista</span>
                        </Button>
                        {viewMode === 'ordinary' && (
                            <div className="flex gap-2">
                                {group?.classroomCourseId && (
                                    <>
                                        <Button variant="secondary" size="sm" onClick={() => setSyncModalOpen(true)} className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                                            <Icon name="download-cloud" className="w-4 h-4" />
                                            <span className="hidden lg:inline ml-1">Importar Tareas</span>
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={handleSyncAll} className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                                            <Icon name="refresh-cw" className="w-4 h-4" />
                                            <span className="hidden lg:inline ml-1">Sincronizar Todo</span>
                                        </Button>
                                    </>
                                )}
                                <Button variant="secondary" size="sm" onClick={() => setCopyModalOpen(true)}><Icon name="copy" className="w-4 h-4" /><span className="hidden lg:inline ml-1">Copiar Tareas</span></Button>
                                <Button variant="secondary" size="sm" onClick={() => setImageModalOpen(true)}><Icon name="camera" className="w-4 h-4" /></Button>
                                <Button variant="secondary" size="sm" onClick={() => setGroupConfigOpen(true)}><Icon name="settings" className="w-4 h-4" /></Button>
                                <Button size="sm" onClick={() => { setEditingEvaluation(undefined); setEvalModalOpen(true); }}><Icon name="plus" className="w-4 h-4" /> <span className="hidden sm:inline ml-1">Nueva Evaluación</span></Button>
                            </div>
                        )}
                    </div>
                </div>

                {group ? (
                    <div className="flex-1 bg-surface rounded-xl border border-border-color shadow-sm overflow-hidden flex flex-col relative">
                        <AnimatePresence>
                            {selection.start && selection.end && !selection.isDragging && (Math.abs(selection.start.r - selection.end.r) > 0 || selection.start.c !== selection.end.c) && (
                                <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed z-[100] bg-white border border-indigo-200 shadow-2xl p-1.5 rounded-xl flex items-center gap-2" style={{ left: Math.min(window.innerWidth - 250, floatingPos.x), top: Math.min(window.innerHeight - 80, floatingPos.y + 15) }}>
                                    <div className="bg-indigo-600 p-2 rounded-lg text-white"><Icon name="edit-3" className="w-4 h-4" /></div>
                                    <input id="bulk-fill-input" type="number" step="0.1" min="0" placeholder="Nota..." className="w-20 p-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary font-bold" value={bulkGradeValue} onChange={e => setBulkGradeValue(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleBulkFill()} />
                                    <Button id="bulk-fill-btn" size="sm" onClick={handleBulkFill} className="!py-1.5 !px-3 shadow-sm">Llenar</Button>
                                    <button onClick={() => setSelection({ start: null, end: null, isDragging: false })} className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><Icon name="x" className="w-4 h-4" /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="flex-1 flex flex-col select-none relative min-h-0">
                            {viewMode === 'ordinary' ? (
                                <OrdinaryGradesTable
                                    group={group}
                                    students={filteredStudents}
                                    grades={groupGrades}
                                    attendance={attendance[group.id] || {}}
                                    evaluations={groupEvaluations}
                                    p1Evaluations={p1Evaluations}
                                    p2Evaluations={p2Evaluations}
                                    p1AttendanceType={p1AttendanceType}
                                    p2AttendanceType={p2AttendanceType}
                                    settings={settings}
                                    displayTeamType={displayTeamType}
                                    setDisplayTeamType={setDisplayTeamType}
                                    handleGradeChange={handleGradeChange}
                                    handleReorder={handleReorder}
                                    setEditingEvaluation={setEditingEvaluation}
                                    setConfirmDeleteEval={setConfirmDeleteEval}
                                    setEvalModalOpen={setEvalModalOpen}
                                    isSelected={isSelected}
                                    onMouseDown={onMouseDown}
                                    onMouseEnter={onMouseEnter}
                                    handlePaste={handlePaste}
                                    onSync={handleSync}
                                />
                            ) : (
                                <RecoveryGradesTable
                                    group={group}
                                    students={studentsForRecovery}
                                    grades={groupGrades}
                                    attendance={attendance[group.id] || {}}
                                    evaluations={groupEvaluations}
                                    settings={settings}
                                    handleGradeChange={handleGradeChange}
                                    isSelected={isSelected}
                                    onMouseDown={onMouseDown}
                                    onMouseEnter={onMouseEnter}
                                    handlePaste={handlePaste}
                                />
                            )}
                        </div>
                    </div>
                ) : <div className="flex-1 flex items-center justify-center text-text-secondary"><p>Selecciona un grupo para calificar.</p></div>}

                {group && (
                    <>
                        <ClassroomSyncModal
                            isOpen={isSyncModalOpen}
                            onClose={() => setSyncModalOpen(false)}
                            group={group}
                            onImport={handleImportAssignments}
                        />
                        <Modal isOpen={isEvalModalOpen} onClose={() => setEvalModalOpen(false)} title={editingEvaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}><EvaluationForm evaluation={editingEvaluation} group={group} onSave={(ev) => { saveEvaluation(ev); setEvalModalOpen(false); }} onCancel={() => setEvalModalOpen(false)} /></Modal>
                        <Modal isOpen={isGroupConfigOpen} onClose={() => setGroupConfigOpen(false)} title="Configuración del Grupo" size="xl"><GroupForm group={group} onSave={(ug) => { dispatch({ type: 'SAVE_GROUP', payload: ug }); setGroupConfigOpen(false); }} onCancel={() => setGroupConfigOpen(false)} /></Modal>
                        <GradeImageModal isOpen={isImageModalOpen} onClose={() => setImageModalOpen(false)} group={group} evaluations={groupEvaluations} grades={groupGrades} attendance={attendance[group.id] || {}} settings={settings} />
                        <CopyEvaluationsModal isOpen={isCopyModalOpen} onClose={() => setCopyModalOpen(false)} targetGroup={group} />
                        <ConfirmationModal isOpen={!!confirmDeleteEval} onClose={() => setConfirmDeleteEval(null)} onConfirm={deleteEvaluationAction} title="Eliminar Evaluación" variant="danger" confirmText="Eliminar">¿Seguro que deseas eliminar la evaluación <strong>"{confirmDeleteEval?.name}"</strong>?</ConfirmationModal>
                    </>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default GradesView;