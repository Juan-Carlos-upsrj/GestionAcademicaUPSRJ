import React, { useMemo, useRef } from 'react';
import { Evaluation, Group, Student, Settings, EvaluationType } from '../../types';
import { calculatePartialAverage, getGradeColor, calculateAttendancePercentage } from '../../services/gradeCalculation';
import Icon from '../icons/Icon';

interface OrdinaryGradesTableProps {
    group: Group;
    students: Student[];
    grades: { [studentId: string]: { [evaluationId: string]: number | null } };
    attendance: { [studentId: string]: { [date: string]: any } };
    evaluations: Evaluation[];
    p1Evaluations: Evaluation[];
    p2Evaluations: Evaluation[];
    p1AttendanceType?: EvaluationType;
    p2AttendanceType?: EvaluationType;
    settings: Settings;
    displayTeamType: 'base' | 'coyote';
    setDisplayTeamType: React.Dispatch<React.SetStateAction<'base' | 'coyote'>>;
    handleGradeChange: (studentId: string, evaluationId: string, score: string) => void;
    handleReorder: (evaluationId: string, direction: 'left' | 'right') => void;
    setEditingEvaluation: (ev: Evaluation) => void;
    setConfirmDeleteEval: (ev: Evaluation) => void;
    setEvalModalOpen: (open: boolean) => void;
    isSelected: (r: number, cId: string) => boolean;
    onMouseDown: (r: number, c: string, e: React.MouseEvent) => void;
    onMouseEnter: (r: number, c: string) => void;
    handlePaste: (e: React.ClipboardEvent, studentIndex: number, evaluationId: string) => void;
    onSync: (ev: Evaluation) => void;
}

const OrdinaryGradesTable: React.FC<OrdinaryGradesTableProps> = ({
    group,
    students,
    grades,
    attendance,
    p1Evaluations,
    p2Evaluations,
    p1AttendanceType,
    p2AttendanceType,
    settings,
    displayTeamType,
    setDisplayTeamType,
    handleGradeChange,
    handleReorder,
    setEditingEvaluation,
    setConfirmDeleteEval,
    setEvalModalOpen,
    isSelected,
    onMouseDown,
    onMouseEnter,
    handlePaste,
    onSync
}) => {
    const attThresholdNote = useMemo(() => (settings.lowAttendanceThreshold || 80) / 10, [settings.lowAttendanceThreshold]);
    const hasBothTeamTypes = useMemo(() => group.students.some(s => s.team) && group.students.some(s => s.teamCoyote), [group]);

    // Sticky Scroll Logic
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const renderHeaderButtons = (ev: Evaluation) => {
        const samePartialEvals = ev.partial === 1 ? p1Evaluations : p2Evaluations;
        const isFirst = samePartialEvals[0]?.id === ev.id;
        const isLast = samePartialEvals[samePartialEvals.length - 1]?.id === ev.id;

        return (
            <div className="flex flex-col items-center justify-center p-1 relative group w-full h-full min-w-[80px]">
                <div className="absolute top-0 right-0 flex sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/95 rounded-md shadow-md z-30 p-0.5 border border-slate-200 backdrop-blur-sm">
                    {ev.classroomCourseWorkId && (
                        <button onClick={() => onSync(ev)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Sincronizar con Classroom"><Icon name="download-cloud" className="w-3.5 h-3.5" /></button>
                    )}
                    {!isFirst && (
                        <button onClick={() => handleReorder(ev.id, 'left')} className="p-1 text-slate-600 hover:bg-slate-100 rounded" title="Mover Izquierda"><Icon name="chevron-left" className="w-3.5 h-3.5" /></button>
                    )}
                    <button onClick={() => { setEditingEvaluation(ev); setEvalModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Icon name="edit-3" className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setConfirmDeleteEval(ev)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Borrar"><Icon name="trash-2" className="w-3.5 h-3.5" /></button>
                    {!isLast && (
                        <button onClick={() => handleReorder(ev.id, 'right')} className="p-1 text-slate-600 hover:bg-slate-100 rounded" title="Mover Derecha"><Icon name="chevron-right" className="w-3.5 h-3.5" /></button>
                    )}
                </div>
                {ev.isTeamBased && <div className="flex items-center gap-1 mb-0.5"><Icon name={ev.teamType === 'coyote' ? "dog" : "users"} className={`w-3 h-3 ${ev.teamType === 'coyote' ? 'text-orange-500' : 'text-indigo-500'}`} /></div>}
                <span className={`text-[10px] font-bold leading-tight line-clamp-2 px-1 text-center ${ev.isTeamBased ? (ev.teamType === 'coyote' ? 'text-orange-800' : 'text-indigo-800') : ''} ${ev.classroomCourseWorkId ? 'text-green-800' : ''}`}>{ev.name}</span>
                <span className="text-[9px] opacity-60 font-normal">({ev.maxScore} pts)</span>
            </div>
        );
    };

    return (
        <div ref={tableContainerRef} className="flex-1 overflow-auto custom-scrollbar bg-white rounded-xl shadow-sm border border-slate-200">
            <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-20 shadow-sm bg-slate-50">
                    <tr className="bg-slate-50 border-b border-slate-200">
                        {/* ALUMNO Header */}
                        <th rowSpan={2} className="sticky left-0 z-30 bg-slate-50 p-3 text-left font-bold border-b border-r border-slate-200 min-w-[250px]">
                            Alumno
                        </th>

                        {/* TEAMS Header */}
                        {settings.showTeamsInGrades && (
                            <th rowSpan={2} className="p-0 font-bold text-center border-b border-r border-slate-200 bg-slate-100 text-[10px] w-16 min-w-[60px]">
                                <div className="flex flex-col h-full items-center justify-center gap-1">
                                    <span className="uppercase tracking-tighter opacity-60">Eq.</span>
                                    {hasBothTeamTypes ? (
                                        <button onClick={(e) => { e.stopPropagation(); setDisplayTeamType(prev => prev === 'base' ? 'coyote' : 'base'); }} className={`p-1 rounded-md transition-all flex items-center gap-1.5 ${displayTeamType === 'coyote' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}><Icon name={displayTeamType === 'coyote' ? "dog" : "users"} className="w-3 h-3" /></button>
                                    ) : <Icon name={displayTeamType === 'coyote' ? "dog" : "users"} className="w-3.5 h-3.5 text-slate-400" />}
                                </div>
                            </th>
                        )}

                        {/* PARTIAL 1 Header Group */}
                        <th colSpan={p1Evaluations.length + (p1AttendanceType ? 1 : 0) + 1} className="p-1.5 font-bold text-center border-b border-r border-slate-200 bg-indigo-50 text-indigo-700">
                            Primer Parcial
                        </th>

                        {/* PARTIAL 2 Header Group */}
                        <th colSpan={p2Evaluations.length + (p2AttendanceType ? 1 : 0) + 1} className="p-1.5 font-bold text-center border-b border-slate-200 bg-blue-50 text-blue-700">
                            Segundo Parcial
                        </th>
                    </tr>
                    <tr className="bg-slate-50">
                        {/* P1 Columns */}
                        {p1Evaluations.map(ev => (
                            <th key={ev.id} className="border-b border-r border-slate-200 min-w-[80px] p-0">
                                {renderHeaderButtons(ev)}
                            </th>
                        ))}
                        {p1AttendanceType && <th className="p-2 font-bold text-center border-b border-r border-slate-200 text-emerald-600 min-w-[50px]">Asist.</th>}
                        <th className="p-2 font-bold text-center border-b border-r border-slate-200 bg-indigo-100/50 text-indigo-800 min-w-[50px]">PROM</th>

                        {/* P2 Columns */}
                        {p2Evaluations.map(ev => (
                            <th key={ev.id} className="border-b border-r border-slate-200 min-w-[80px] p-0">
                                {renderHeaderButtons(ev)}
                            </th>
                        ))}
                        {p2AttendanceType && <th className="p-2 font-bold text-center border-b border-r border-slate-200 text-emerald-600 min-w-[50px]">Asist.</th>}
                        <th className="p-2 font-bold text-center border-b bg-blue-100/50 text-blue-800 min-w-[50px]">PROM</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student, idx) => {
                        const studentGrades = grades[student.id] || {};
                        const studentAttendance = attendance[student.id] || {};

                        const p1Avg = calculatePartialAverage(group, 1, p1Evaluations, studentGrades, settings, studentAttendance);
                        const p2Avg = calculatePartialAverage(group, 2, p2Evaluations, studentGrades, settings, studentAttendance);
                        const p1AttNote = calculateAttendancePercentage(group, 1, settings, studentAttendance) / 10;
                        const p2AttNote = calculateAttendancePercentage(group, 2, settings, studentAttendance) / 10;
                        const globalAtt = calculateAttendancePercentage(group, 'global', settings, studentAttendance);

                        const tolerance = 5;
                        const isCriticalFail = globalAtt < (settings.lowAttendanceThreshold - tolerance);
                        const isRisk = globalAtt < settings.lowAttendanceThreshold && !isCriticalFail;
                        const teamValue = displayTeamType === 'coyote' ? student.teamCoyote : student.team;

                        // Row Background Logic
                        let rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40';
                        if (isCriticalFail && settings.failByAttendance) {
                            rowBg = '!bg-rose-50/30';
                        } else if (isRisk || isCriticalFail) {
                            rowBg = '!bg-indigo-50/20';
                        }

                        const stickyBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'; // Need opaque for sticky

                        return (
                            <tr key={student.id} className={`${rowBg} border-b border-slate-100 hover:bg-indigo-50/20 group`}>
                                {/* Sticky Name Column */}
                                <td className={`sticky left-0 p-2.5 font-medium border-r border-slate-100 z-10 whitespace-nowrap ${rowBg} backdrop-blur-sm group-hover:bg-indigo-50/20`}>
                                    {/* Note: backdrop-blur isn't perfect for sticky opacity, using explicit bg is better but tricky with dynamic rows. 
                                        Standard table sticky needs opaque background.
                                        Let's try to match rowBg but if it's transparent, we see data underneath.
                                        Ideally we set a solid color.
                                    */}
                                    <div className={`absolute inset-0 ${stickyBg} -z-10`} style={{ opacity: (isCriticalFail || isRisk) ? 0.8 : 1 }}></div>

                                    <div className="flex items-center gap-1.5 relative z-10">
                                        <span className="text-[10px] text-slate-400 w-5 inline-block text-right">{idx + 1}.</span>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold ${(isCriticalFail && settings.failByAttendance) ? 'text-rose-600' : (isRisk || isCriticalFail) ? 'text-indigo-600' : ''}`}>
                                                    {student.name}
                                                </span>
                                                {isCriticalFail && settings.failByAttendance && <span className="text-[7px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm border border-rose-700">Reprobado</span>}
                                                {isCriticalFail && !settings.failByAttendance && <span className="text-[7px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm border border-indigo-600">Baja</span>}
                                            </div>
                                            {student.nickname && <span className="text-[10px] text-text-secondary italic leading-none mt-0.5">({student.nickname})</span>}
                                        </div>
                                        {student.isRepeating && <span className="bg-rose-600 text-white text-[8px] font-bold px-1 rounded-full shrink-0 ml-auto mr-2">R</span>}
                                    </div>
                                </td>

                                {settings.showTeamsInGrades && (
                                    <td className="p-1 text-center font-bold border-r border-slate-100 text-[10px] truncate max-w-[80px]">
                                        {teamValue || '-'}
                                    </td>
                                )}

                                {/* P1 Evals */}
                                {p1Evaluations.map(ev => (
                                    <td key={ev.id}
                                        className={`p-1 border-r border-slate-100 transition-colors ${isSelected(idx, ev.id) ? 'bg-indigo-100/80 ring-2 ring-indigo-500 ring-inset z-10' : ''}`}
                                        onMouseDown={(e) => onMouseDown(idx, ev.id, e)}
                                        onMouseEnter={() => onMouseEnter(idx, ev.id)}
                                    >
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={studentGrades?.[ev.id] ?? ''}
                                            onChange={(e) => handleGradeChange(student.id, ev.id, e.target.value)}
                                            onPaste={(e) => handlePaste(e, idx, ev.id)}
                                            className={`w-full max-w-[50px] mx-auto block bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-primary rounded py-1 ${isSelected(idx, ev.id) ? 'font-black text-indigo-900' : ''}`}
                                            placeholder="-"
                                        />
                                    </td>
                                ))}
                                {p1AttendanceType && (
                                    <td className={`p-1 text-center font-black border-r border-slate-100 ${p1AttNote < attThresholdNote ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {p1AttNote.toFixed(1)}
                                    </td>
                                )}
                                <td className={`p-2 text-center font-bold border-r border-slate-200 bg-slate-50/50 ${getGradeColor(p1Avg)}`}>
                                    {p1Avg?.toFixed(1) || '-'}
                                </td>

                                {/* P2 Evals */}
                                {p2Evaluations.map(ev => (
                                    <td key={ev.id}
                                        className={`p-1 border-r border-slate-100 transition-colors ${isSelected(idx, ev.id) ? 'bg-indigo-100/80 ring-2 ring-indigo-500 ring-inset z-10' : ''}`}
                                        onMouseDown={(e) => onMouseDown(idx, ev.id, e)}
                                        onMouseEnter={() => onMouseEnter(idx, ev.id)}
                                    >
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={studentGrades?.[ev.id] ?? ''}
                                            onChange={(e) => handleGradeChange(student.id, ev.id, e.target.value)}
                                            onPaste={(e) => handlePaste(e, idx, ev.id)}
                                            className={`w-full max-w-[50px] mx-auto block bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-primary rounded py-1 ${isSelected(idx, ev.id) ? 'font-black text-indigo-900' : ''}`}
                                            placeholder="-"
                                        />
                                    </td>
                                ))}
                                {p2AttendanceType && (
                                    <td className={`p-1 text-center font-black border-r border-slate-100 ${p2AttNote < attThresholdNote ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {p2AttNote.toFixed(1)}
                                    </td>
                                )}
                                <td className={`p-2 text-center font-bold bg-slate-50/50 ${getGradeColor(p2Avg)}`}>
                                    {p2Avg?.toFixed(1) || '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default OrdinaryGradesTable;
