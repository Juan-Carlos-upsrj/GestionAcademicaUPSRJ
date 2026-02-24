import React from 'react';
import { Group, Student, Settings, Evaluation } from '../../types';
import { getGradeColor, calculatePartialAverage, calculateAttendancePercentage, calculateFinalGradeWithRecovery } from '../../services/gradeCalculation';
import { GRADE_REMEDIAL_P1, GRADE_REMEDIAL_P2, GRADE_EXTRA, GRADE_SPECIAL } from '../../hooks/useGradesManager';

interface RecoveryGradesTableProps {
    group: Group;
    students: Student[]; // These should be the filtered studentsForRecovery
    grades: { [studentId: string]: { [evaluationId: string]: number | null } };
    attendance: { [studentId: string]: { [date: string]: any } };
    evaluations: Evaluation[];
    settings: Settings;
    handleGradeChange: (studentId: string, evaluationId: string, score: string) => void;
    // Selection / Bulk Interface
    isSelected: (r: number, cId: string) => boolean;
    onMouseDown: (r: number, c: string, e: React.MouseEvent) => void;
    onMouseEnter: (r: number, c: string) => void;
    handlePaste: (e: React.ClipboardEvent, studentIndex: number, evaluationId: string) => void;
}

const RecoveryGradesTable: React.FC<RecoveryGradesTableProps> = ({
    group, students, grades, attendance, evaluations, settings,
    handleGradeChange, isSelected, onMouseDown, onMouseEnter, handlePaste
}) => {
    return (
        <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-amber-50 dark:bg-amber-900/40 shadow-sm font-bold">
                <tr className="text-amber-900 dark:text-amber-300 border-b border-amber-200 dark:border-amber-700/50">
                    <th className="p-3 text-left">Alumno</th>
                    <th className="p-2 text-center">Asist %</th>
                    <th className="p-2 text-center">Rem P1</th>
                    <th className="p-2 text-center">Rem P2</th>
                    <th className="p-2 text-center">Extra</th>
                    <th className="p-2 text-center">Especial</th>
                    <th className="p-2 text-center bg-amber-100/50 dark:bg-amber-800/40">FINAL</th>
                </tr>
            </thead>
            <tbody>
                {students.map((student, idx) => {
                    const att = attendance[student.id] || {};
                    const globalAtt = calculateAttendancePercentage(group, 'global', settings, att);
                    const p1Avg = calculatePartialAverage(group, 1, evaluations, grades[student.id] || {}, settings, att);
                    const p2Avg = calculatePartialAverage(group, 2, evaluations, grades[student.id] || {}, settings, att);
                    const r1 = grades[student.id]?.[GRADE_REMEDIAL_P1] ?? null;
                    const r2 = grades[student.id]?.[GRADE_REMEDIAL_P2] ?? null;
                    const extra = grades[student.id]?.[GRADE_EXTRA] ?? null;
                    const special = grades[student.id]?.[GRADE_SPECIAL] ?? null;
                    const { score: finalScore, attendanceStatus } = calculateFinalGradeWithRecovery(p1Avg, p2Avg, r1, r2, extra, special, globalAtt, settings.lowAttendanceThreshold, settings.failByAttendance);

                    // LÓGICA DE HABILITACIÓN ("Waterflow Logic")
                    const canRemP1 = p1Avg !== null && p1Avg < 7;
                    const canRemP2 = p2Avg !== null && p2Avg < 7;
                    const effectiveP1 = r1 !== null ? r1 : (p1Avg ?? 0);
                    const effectiveP2 = r2 !== null ? r2 : (p2Avg ?? 0);
                    const canExtra = (effectiveP1 < 7 || effectiveP2 < 7);
                    const canSpecial = student.isRepeating && ((r1 !== null && r1 < 7) || (r2 !== null && r2 < 7) || (extra !== null && extra < 7));

                    return (
                        <tr key={student.id} className={`border-b border-amber-100 dark:border-amber-900/30 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-amber-50/30 dark:bg-amber-900/10'} ${attendanceStatus === 'fail' && settings.failByAttendance ? 'bg-rose-50 dark:bg-rose-900/20' : (attendanceStatus === 'fail' || attendanceStatus === 'risk') ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : ''}`}>
                            <td className="p-2.5 font-bold whitespace-nowrap">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className={(attendanceStatus === 'fail' && settings.failByAttendance) ? 'text-rose-700 dark:text-rose-400' : (attendanceStatus === 'fail' || attendanceStatus === 'risk') ? 'text-indigo-800 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}>{student.name}</span>
                                        {attendanceStatus === 'fail' && settings.failByAttendance && <span className="text-[7px] font-black bg-rose-700 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm">Reprobado por Faltas</span>}
                                        {attendanceStatus === 'fail' && !settings.failByAttendance && <span className="text-[7px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm">Baja Asistencia</span>}
                                        {attendanceStatus === 'risk' && <span className="text-[7px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm">Riesgo por Asistencia</span>}
                                    </div>
                                    <span className="text-[9px] font-normal text-slate-400">Mat: {student.matricula} {student.isRepeating && <span className="font-black text-rose-600 dark:text-rose-400 ml-1">(RECURSAMIENTO)</span>}</span>
                                </div>
                            </td>
                            <td className={`p-1 text-center font-black ${attendanceStatus === 'fail' && settings.failByAttendance ? 'text-rose-600 dark:text-rose-400' : (attendanceStatus === 'fail' || attendanceStatus === 'risk') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{globalAtt.toFixed(0)}%</td>
                            <td className={`p-1 text-center transition-colors ${isSelected(idx, GRADE_REMEDIAL_P1) ? 'bg-amber-200 dark:bg-amber-800/60' : ''}`} onMouseDown={(e) => canRemP1 && onMouseDown(idx, GRADE_REMEDIAL_P1, e)} onMouseEnter={() => canRemP1 && onMouseEnter(idx, GRADE_REMEDIAL_P1)}>
                                <input type="number" min="0" value={r1 ?? ''} onChange={(e) => handleGradeChange(student.id, GRADE_REMEDIAL_P1, e.target.value)} onPaste={(e) => handlePaste(e, idx, GRADE_REMEDIAL_P1)} disabled={!canRemP1} className={`w-12 text-center rounded py-1 bg-transparent dark:text-slate-200 ${!canRemP1 ? 'opacity-10 cursor-not-allowed' : 'border-amber-200 dark:border-amber-700/50 focus:ring-amber-500'}`} />
                            </td>
                            <td className={`p-1 text-center transition-colors ${isSelected(idx, GRADE_REMEDIAL_P2) ? 'bg-amber-200 dark:bg-amber-800/60' : ''}`} onMouseDown={(e) => canRemP2 && onMouseDown(idx, GRADE_REMEDIAL_P2, e)} onMouseEnter={() => canRemP2 && onMouseEnter(idx, GRADE_REMEDIAL_P2)}>
                                <input type="number" min="0" value={r2 ?? ''} onChange={(e) => handleGradeChange(student.id, GRADE_REMEDIAL_P2, e.target.value)} onPaste={(e) => handlePaste(e, idx, GRADE_REMEDIAL_P2)} disabled={!canRemP2} className={`w-12 text-center rounded py-1 bg-transparent dark:text-slate-200 ${!canRemP2 ? 'opacity-10 cursor-not-allowed' : 'border-amber-200 dark:border-amber-700/50 focus:ring-amber-500'}`} />
                            </td>
                            <td className={`p-1 text-center transition-colors ${isSelected(idx, GRADE_EXTRA) ? 'bg-amber-200 dark:bg-amber-800/60' : ''}`} onMouseDown={(e) => canExtra && onMouseDown(idx, GRADE_EXTRA, e)} onMouseEnter={() => canExtra && onMouseEnter(idx, GRADE_EXTRA)}>
                                <input type="number" min="0" value={extra ?? ''} onChange={(e) => handleGradeChange(student.id, GRADE_EXTRA, e.target.value)} onPaste={(e) => handlePaste(e, idx, GRADE_EXTRA)} disabled={!canExtra} className={`w-12 text-center rounded py-1 bg-transparent dark:text-slate-200 ${!canExtra ? 'opacity-10 cursor-not-allowed' : 'border-amber-400 dark:border-amber-600/50 focus:ring-amber-500'}`} />
                            </td>
                            <td className={`p-1 text-center transition-colors ${isSelected(idx, GRADE_SPECIAL) ? 'bg-amber-200 dark:bg-amber-800/60' : ''}`} onMouseDown={(e) => canSpecial && onMouseDown(idx, GRADE_SPECIAL, e)} onMouseEnter={() => canSpecial && onMouseEnter(idx, GRADE_SPECIAL)}>
                                <input type="number" min="0" value={special ?? ''} onChange={(e) => handleGradeChange(student.id, GRADE_SPECIAL, e.target.value)} onPaste={(e) => handlePaste(e, idx, GRADE_SPECIAL)} disabled={!canSpecial} className={`w-12 text-center rounded py-1 bg-transparent dark:text-slate-200 ${!canSpecial ? 'opacity-10 cursor-not-allowed' : 'border-amber-500 dark:border-amber-500/50 focus:ring-amber-500'}`} />
                            </td>
                            <td className={`p-2 text-center font-black bg-amber-100/50 dark:bg-amber-800/40 ${getGradeColor(finalScore)} ${attendanceStatus === 'fail' && settings.failByAttendance ? 'ring-2 ring-rose-500 ring-inset' : (attendanceStatus === 'fail' || attendanceStatus === 'risk') ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}>
                                {finalScore?.toFixed(1) || '-'}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default RecoveryGradesTable;
