import React, { useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { useScanner } from '../hooks/useScanner';
import { useSettings } from '../context/SettingsContext';
import { AttendanceStatus, Student } from '../types';
import { getClassDates } from '../services/dateUtils';
import { STATUS_STYLES, ATTENDANCE_STATUSES } from '../constants';
import Icon from './icons/Icon';
import Modal from './common/Modal';
import Button from './common/Button';
import AttendanceTaker from './AttendanceTaker';
import BulkAttendanceModal from './BulkAttendanceModal';
import AttendanceTextImporter from './AttendanceTextImporter';
import QRCodeAttendanceModal from './QRCodeAttendanceModal';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import AutoSizer from 'react-virtualized-auto-sizer';
import { 
    AttendanceInternalContext, 
    InnerElement, 
    Row, 
    List, 
    DATE_COL_WIDTH, 
    STAT_COL_WIDTH,
    ROW_HEIGHT, 
    StatDisplayMode, 
    Coords,
    AttendanceContextValue
} from './attendance/AttendanceTable';

// --- CONSTANTS & CONFIG ---
const getResponsiveNameColWidth = () => window.innerWidth < 768 ? 140 : 300;

const calculateStats = (studentAttendance: any, dates: string[]) => {
    let absences = 0;
    const totalPossible = dates.length;

    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const status = (studentAttendance[date] || AttendanceStatus.Pending) as AttendanceStatus;
        if (status === AttendanceStatus.Absent) {
            absences++;
        }
    }

    return {
        percent: totalPossible > 0 ? Math.round(((totalPossible - absences) / totalPossible) * 100) : 100,
        absences
    };
};

const AttendanceView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { settings } = useSettings();
    const { groups, attendance, selectedGroupId } = state;

    const [isTakerOpen, setTakerOpen] = useState(false);
    const [isBulkFillOpen, setBulkFillOpen] = useState(false);
    const [isTextImporterOpen, setTextImporterOpen] = useState(false);
    const [isQrOpen, setQrOpen] = useState(false);
    const [isScannerMode, setScannerMode] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [nameColWidth, setNameColWidth] = useState(getResponsiveNameColWidth());
    const [displayMode, setDisplayMode] = useState<StatDisplayMode>('percent');

    // ESTADOS PARA BARRA FLOTANTE (ESTILO EXCEL)
    const [selection, setSelection] = useState<{ start: Coords | null; end: Coords | null; isDragging: boolean }>({ start: null, end: null, isDragging: false });
    const [floatingPos, setFloatingPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setIsReady(false);
        const timer = setTimeout(() => setIsReady(true), 150);
        return () => clearTimeout(timer);
    }, [selectedGroupId]);

    useEffect(() => {
        const handleResize = () => setNameColWidth(getResponsiveNameColWidth());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const listRef = useRef<any>(null);

    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const [focusedCell, setFocusedCell] = useState<Coords | null>(null);
    const stateRef = useRef({ focusedCell, selection, filteredStudents: [] as Student[], classDates: [] as string[] });

    const setSelectedGroupId = useCallback((id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
    }, [dispatch]);

    const group = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);

    const filteredStudents = useMemo(() => {
        if (!group) return [];
        if (!searchTerm.trim()) return group.students;
        const term = searchTerm.toLowerCase();
        return group.students.filter(s =>
            s.name.toLowerCase().includes(term) ||
            (s.matricula && s.matricula.toLowerCase().includes(term)) ||
            (s.nickname && s.nickname.toLowerCase().includes(term))
        );
    }, [group, searchTerm]);

    const todayDayName = useMemo(() => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[new Date().getDay()];
    }, []);

    const todaysGroups = useMemo(
        () => groups.filter(g => g.classDays.some(d => d.toLowerCase() === todayDayName.toLowerCase())),
        [groups, todayDayName]
    );

    // Auto-seleccionar grupo de hoy si no hay ninguno seleccionado
    useEffect(() => {
        if (!selectedGroupId && groups.length > 0) {
            const todayGroup = todaysGroups[0];
            setSelectedGroupId(todayGroup ? todayGroup.id : groups[0].id);
        }
    }, [groups, selectedGroupId, setSelectedGroupId, todaysGroups]);

    const classDates = useMemo(() => group ? getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays) : [], [group, settings]);

    useEffect(() => {
        stateRef.current = { focusedCell, selection, filteredStudents, classDates };
    }, [focusedCell, selection, filteredStudents, classDates]);

    const handleStatusChange = useCallback((studentId: string, date: string, status: AttendanceStatus) => {
        if (selectedGroupId) dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: selectedGroupId, studentId, date, status } });
    }, [selectedGroupId, dispatch]);

    // ESCÁNER BLUETOOTH — Lee NDEF (matrícula o URL con ?id=) de la tarjeta
    useScanner(useCallback((scanData: string) => {
        if (!group) {
            dispatch({ type: 'ADD_TOAST', payload: { message: '⚠️ Selecciona un grupo antes de escanear', type: 'error' }});
            return;
        }
        // Extraer ID de múltiples formatos:
        // 1. URL con ?id=  → https://...?id=24000386
        // 2. Solo número   → 24000386
        // 3. UID hex       → A3F2B1C0 (fallback sin NDEF)
        let extractedId = scanData.trim();
        if (scanData.includes('?id=')) {
            extractedId = scanData.split('?id=')[1].split('&')[0].trim();
        } else if (scanData.includes('/scan/')) {
            extractedId = scanData.split('/scan/').pop()?.split('?')[0].trim() ?? scanData;
        }

        const student = group.students.find(s =>
            s.matricula === extractedId ||
            s.id === extractedId ||
            s.matricula?.toLowerCase() === extractedId.toLowerCase()
        );

        if (student) {
            handleStatusChange(student.id, todayStr, AttendanceStatus.Present);
            setScannerMode(true);
            dispatch({ type: 'ADD_TOAST', payload: { message: `✅ ${student.name}`, type: 'success' }});
        } else {
            dispatch({ type: 'ADD_TOAST', payload: { message: `❌ No encontrado: ${extractedId}`, type: 'error' }});
        }
    }, [group, handleStatusChange, todayStr, dispatch]));

    const handleMouseDown = useCallback((r: number, c: number) => {
        setSelection({ start: { r, c }, end: { r, c }, isDragging: true });
        setFocusedCell({ r, c });
    }, []);

    const handleMouseEnter = useCallback((r: number, c: number) => {
        setSelection(prev => prev.isDragging ? { ...prev, end: { r, c } } : prev);
    }, []);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (selection.isDragging) {
            setSelection(prev => ({ ...prev, isDragging: false }));
            setFloatingPos({ x: e.clientX, y: e.clientY });
        }
    }, [selection.isDragging]);

    const handleBulkFill = (status: AttendanceStatus) => {
        if (!selection.start || !selection.end || !selectedGroupId) return;

        const minR = Math.min(selection.start.r, selection.end.r);
        const maxR = Math.max(selection.start.r, selection.end.r);
        const minC = Math.min(selection.start.c, selection.end.c);
        const maxC = Math.max(selection.start.c, selection.end.c);

        let count = 0;
        for (let r = minR; r <= maxR; r++) {
            const student = filteredStudents[r];
            if (!student) continue;
            for (let c = minC; c <= maxC; c++) {
                const date = classDates[c];
                if (!date) continue;
                dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: selectedGroupId, studentId: student.id, date, status } });
                count++;
            }
        }

        dispatch({ type: 'ADD_TOAST', payload: { message: `Actualizados ${count} registros de asistencia.`, type: 'success' } });
        setSelection({ start: null, end: null, isDragging: false });
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => setSelection(prev => prev.isDragging ? { ...prev, isDragging: false } : prev);

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target;
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target as HTMLElement).isContentEditable) {
                return;
            }

            const { focusedCell, selection, filteredStudents, classDates } = stateRef.current;
            if (filteredStudents.length === 0) return;

            if (focusedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                let { r, c } = focusedCell;
                if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
                if (e.key === 'ArrowDown') r = Math.min(filteredStudents.length - 1, r + 1);
                if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
                if (e.key === 'ArrowRight') c = Math.min(classDates.length - 1, c + 1);
                setFocusedCell({ r, c });
                if (listRef.current && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) listRef.current.scrollToItem(r);
                return;
            }

            const keyMap: any = { 'p': 'Presente', 'a': 'Ausente', 'r': 'Retardo', 'j': 'Justificado', 'i': 'Intercambio', 'delete': 'Pendiente' };
            const status = keyMap[e.key.toLowerCase()];

            if (status && focusedCell) {
                e.preventDefault();
                let targets = [];
                if (selection.start && selection.end) {
                    const minR = Math.min(selection.start.r, selection.end.r), maxR = Math.max(selection.start.r, selection.end.r);
                    const minC = Math.min(selection.start.c, selection.end.c), maxC = Math.max(selection.start.c, selection.end.c);
                    for (let rowIdx = minR; rowIdx <= maxR; rowIdx++) {
                        for (let colIdx = minC; colIdx <= maxC; colIdx++) {
                            targets.push({ r: rowIdx, c: colIdx });
                        }
                    }
                } else targets.push(focusedCell);

                targets.forEach(({ r, c }) => {
                    const s = filteredStudents[r], d = classDates[c];
                    if (s && d) handleStatusChange(s.id, d, status as AttendanceStatus);
                });
            }
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleStatusChange]);

    const { p1Dates, p2Dates } = useMemo(() => ({
        p1Dates: classDates.filter(d => d <= settings.p1EvalEnd),
        p2Dates: classDates.filter(d => d > settings.p1EvalEnd)
    }), [classDates, settings.p1EvalEnd]);

    const precalcStats = useMemo(() => {
        if (!selectedGroupId) return [];
        return filteredStudents.map(s => {
            const att = attendance[selectedGroupId]?.[s.id] || {};
            return {
                p1: calculateStats(att, p1Dates),
                p2: calculateStats(att, p2Dates),
                global: calculateStats(att, classDates)
            };
        });
    }, [filteredStudents, attendance, selectedGroupId, p1Dates, p2Dates, classDates]);

    const { isCurrentP1, isCurrentP2 } = useMemo(() => ({
        isCurrentP1: todayStr <= settings.p1EvalEnd,
        isCurrentP2: todayStr > settings.p1EvalEnd
    }), [todayStr, settings.p1EvalEnd]);

    const allowedAbsencesLimits = useMemo(() => {
        if (!group || classDates.length === 0) return { p1: 0, p2: 0, global: 0, p1Total: 0, p2Total: 0, totalClasses: 0 };
        const totalClasses = classDates.length;
        const p1Total = p1Dates.length;
        const p2Total = p2Dates.length;
        const threshold = settings.lowAttendanceThreshold / 100;

        return {
            p1: Math.ceil(p1Total * (1 - threshold)),
            p2: Math.ceil(p2Total * (1 - threshold)),
            global: Math.ceil(totalClasses * (1 - threshold)),
            totalClasses,
            p1Total,
            p2Total
        };
    }, [group, classDates, p1Dates, p2Dates, settings.lowAttendanceThreshold]);

    const headerStructure = useMemo(() => {
        const structure = [];
        const p1 = classDates.filter(d => d <= settings.p1EvalEnd);
        const p2 = classDates.filter(d => d > settings.p1EvalEnd);

        const getMonths = (dates: string[]) => {
            const months: any[] = [];
            dates.forEach(d => {
                const m = new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { month: 'long' });
                const label = m.charAt(0).toUpperCase() + m.slice(1);
                const last = months[months.length - 1];
                if (last && last.label === label) last.width += DATE_COL_WIDTH;
                else months.push({ label, width: DATE_COL_WIDTH });
            });
            return months;
        };
        if (p1.length) structure.push({ label: 'Primer Parcial', width: p1.length * DATE_COL_WIDTH, months: getMonths(p1) });
        if (p2.length) structure.push({ label: 'Segundo Parcial', width: p2.length * DATE_COL_WIDTH, months: getMonths(p2) });
        return structure;
    }, [classDates, settings.p1EvalEnd]);

    const totalWidth = useMemo(() => nameColWidth + (classDates.length * DATE_COL_WIDTH) + (STAT_COL_WIDTH * 3), [classDates.length, nameColWidth]);

    const handleScrollToToday = useCallback(() => {
        const idx = classDates.findIndex(d => d >= todayStr);
        if (idx >= 0 && listRef.current) {
            const outer = document.querySelector('.react-window-outer');
            if (outer) outer.scrollLeft = (idx * DATE_COL_WIDTH);
        }
    }, [classDates, todayStr]);

    useEffect(() => {
        if (isReady && group && classDates.length > 0) {
            setTimeout(handleScrollToToday, 200);
        }
    }, [isReady, group?.id, classDates.length, handleScrollToToday]);

    const contextValue: AttendanceContextValue | null = useMemo(() => (!group ? null : {
        students: filteredStudents,
        classDates,
        attendance,
        groupId: group.id,
        focusedCell,
        selection,
        todayStr,
        headerStructure,
        totalWidth,
        nameColWidth,
        displayMode,
        threshold: settings.lowAttendanceThreshold,
        handleStatusChange,
        onMouseDown: handleMouseDown,
        onMouseEnter: handleMouseEnter,
        precalcStats,
        limits: { p1: allowedAbsencesLimits.p1, p2: allowedAbsencesLimits.p2, global: allowedAbsencesLimits.global },
        isCurrentP1,
        isCurrentP2
    }), [filteredStudents, classDates, attendance, group, focusedCell, selection, todayStr, headerStructure, totalWidth, handleStatusChange, handleMouseDown, handleMouseEnter, precalcStats, nameColWidth, displayMode, settings.lowAttendanceThreshold, allowedAbsencesLimits, isCurrentP1, isCurrentP2]);

    return (
        <div className="flex flex-col h-full overflow-hidden" onMouseUp={handleMouseUp}>
            <div className="bg-surface p-3 mb-4 rounded-xl border border-border-color shadow-sm flex flex-col gap-3 shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <select value={selectedGroupId || ''} onChange={(e) => { setSelectedGroupId(e.target.value); setScannerMode(false); }} className="w-full sm:w-64 p-2 border border-border-color rounded-md bg-white text-sm focus:ring-2 focus:ring-primary pr-8">
                            <option value="" disabled>Selecciona un grupo</option>
                            {groups.map(g => {
                                const isToday = g.classDays.some(d => d.toLowerCase() === todayDayName.toLowerCase());
                                return <option key={g.id} value={g.id}>{isToday ? '📅 ' : ''}{g.name} — {g.subject}</option>;
                            })}
                        </select>
                    </div>
                    <div className="relative flex-1 max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Icon name="search" className="h-4 w-4" />
                        </div>
                        <input type="text" className="block w-full pl-9 pr-3 py-2 border border-border-color rounded-md bg-white text-sm focus:ring-1 focus:ring-primary" placeholder="Buscar alumno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {/* BANNER MODO SCANNER — Temporalmente oculto */}
                {false && isScannerMode && group && (
                    <motion.div className="hidden" />
                )}

                {allowedAbsencesLimits && group && (
                    <div className="flex flex-wrap items-center gap-4 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                        <div className="flex items-center gap-2">
                            <Icon name="info" className="w-4 h-4 text-indigo-600" />
                            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Faltas Permitidas:</span>
                        </div>
                        <div className="flex gap-4">
                            <div className={`flex items-center gap-1.5 p-1 rounded ${isCurrentP1 ? 'bg-indigo-100/50 ring-1 ring-indigo-200' : ''}`}>
                                <span className={`text-[9px] font-bold uppercase ${isCurrentP1 ? 'text-indigo-800' : 'text-slate-400'}`}>P1:</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded shadow-sm ${isCurrentP1 ? 'text-white bg-indigo-600' : 'text-indigo-700 bg-white'}`}>{allowedAbsencesLimits.p1}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 p-1 rounded ${isCurrentP2 ? 'bg-indigo-100/50 ring-1 ring-indigo-200' : ''}`}>
                                <span className={`text-[9px] font-bold uppercase ${isCurrentP2 ? 'text-indigo-800' : 'text-slate-400'}`}>P2:</span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded shadow-sm ${isCurrentP2 ? 'text-white bg-indigo-600' : 'text-indigo-700 bg-white'}`}>{allowedAbsencesLimits.p2}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Global:</span>
                                <span className="text-xs font-black text-rose-700 bg-white px-2 py-0.5 rounded shadow-sm border border-rose-100">{allowedAbsencesLimits.global}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 justify-end">
                    <div className="flex items-center gap-4 mr-auto">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2">
                            <Icon name="copy" className="w-3 h-3" /> Arrastra para seleccionar múltiples celdas
                        </span>
                    </div>

                    <div className="flex items-center bg-surface-secondary border border-border-color rounded-md p-0.5" title="Cambiar visualización de estadísticas">
                        <button
                            onClick={() => setDisplayMode('percent')}
                            className={`px-3 py-1 rounded text-xs font-black transition-all ${displayMode === 'percent' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            %
                        </button>
                        <button
                            onClick={() => setDisplayMode('absences')}
                            className={`px-3 py-1 rounded text-xs font-black transition-all ${displayMode === 'absences' ? 'bg-white shadow-sm text-rose-600' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            F
                        </button>
                    </div>

                    <Button onClick={handleScrollToToday} disabled={!group} variant="secondary" size="sm" title="Ir a hoy"><Icon name="calendar" className="w-4 h-4" /></Button>
                    {/* Botón QR Inteligente — Temporalmente oculto */}
                    <Button onClick={() => setTextImporterOpen(true)} disabled={!group} variant="secondary" size="sm" className="hidden md:inline-flex"><Icon name="upload-cloud" className="w-4 h-4" /> Importar</Button>
                    <Button onClick={() => setBulkFillOpen(true)} disabled={!group} variant="secondary" size="sm" className="hidden lg:inline-flex"><Icon name="grid" className="w-4 h-4" /> Relleno</Button>
                    <Button onClick={() => setTakerOpen(true)} disabled={!group} size="sm"><Icon name="list-checks" className="w-4 h-4" /> <span className="hidden sm:inline ml-1">Pase Rápido</span></Button>
                </div>
            </div>

            {group && isReady ? (
                <div className="flex-1 border border-border-color rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm min-h-[200px] relative z-0">
                    {/* BARRA FLOTANTE DE LLENADO MASIVO ASISTENCIA */}
                    <AnimatePresence>
                        {selection.start && selection.end && !selection.isDragging && (Math.abs(selection.start.r - selection.end.r) > 0 || selection.start.c !== selection.end.c) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="fixed z-[100] bg-white border border-indigo-200 shadow-2xl p-1.5 rounded-xl flex items-center gap-1.5"
                                style={{
                                    left: Math.min(window.innerWidth - 300, floatingPos.x),
                                    top: Math.min(window.innerHeight - 80, floatingPos.y + 15)
                                }}
                            >
                                <div className="bg-indigo-600 p-2 rounded-lg text-white mr-1">
                                    <Icon name="list-checks" className="w-4 h-4" />
                                </div>
                                {ATTENDANCE_STATUSES.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleBulkFill(status)}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black transition-all transform hover:scale-110 active:scale-95 ${STATUS_STYLES[status].color}`}
                                        title={status}
                                    >
                                        {STATUS_STYLES[status].symbol}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handleBulkFill(AttendanceStatus.Pending)}
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black transition-all bg-slate-100 text-slate-400 hover:bg-slate-200"
                                    title="Limpiar"
                                >
                                    -
                                </button>
                                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                <button onClick={() => setSelection({ start: null, end: null, isDragging: false })} className="p-1.5 hover:bg-slate-100 rounded text-slate-400">
                                    <Icon name="x" className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AttendanceInternalContext.Provider value={contextValue}>
                        <AutoSizer>
                            {({ height, width }: any) => {
                                if (!height || !width) return null;
                                return (
                                    <List
                                        ref={listRef}
                                        height={height}
                                        width={width}
                                        itemCount={filteredStudents.length}
                                        itemSize={ROW_HEIGHT}
                                        className="react-window-outer"
                                        innerElementType={InnerElement}
                                    >
                                        {Row}
                                    </List>
                                );
                            }}
                        </AutoSizer>
                    </AttendanceInternalContext.Provider>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-surface/50 rounded-xl border border-dashed border-border-color min-h-[300px]">
                    <Icon name="check-square" className="w-16 h-16 text-border-color animate-pulse" />
                    <p className="mt-4 text-text-secondary font-bold uppercase tracking-widest text-xs">{group ? 'Cargando Tabla...' : 'Selecciona un grupo para comenzar.'}</p>
                </div>
            )}

            {group && (<Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase: ${group.name}`}><AttendanceTaker students={group.students} date={todayStr} groupAttendance={attendance[group.id] || {}} onStatusChange={(id, status) => handleStatusChange(id, todayStr, status)} onClose={() => setTakerOpen(false)} /></Modal>)}
            {group && (<BulkAttendanceModal isOpen={isBulkFillOpen} onClose={() => setBulkFillOpen(false)} group={group} />)}
            {group && (<AttendanceTextImporter isOpen={isTextImporterOpen} onClose={() => setTextImporterOpen(false)} group={group} />)}
            {group && (<QRCodeAttendanceModal isOpen={isQrOpen} onClose={() => setQrOpen(false)} group={group} />)}
        </div>
    );
};

export default AttendanceView;