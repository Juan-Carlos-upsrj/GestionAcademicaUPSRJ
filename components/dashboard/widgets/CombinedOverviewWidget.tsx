import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../../context/AppContext';
import { AttendanceStatus } from '../../../types';
import Icon from '../../icons/Icon';

const CombinedOverviewWidget: React.FC<{ todayStr: string }> = ({ todayStr }) => {
    const { state } = useContext(AppContext);
    const dayOfWeek = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const totalStudents = state.groups.reduce((sum, group) => sum + group.students.length, 0);
    const { present, total } = useMemo(() => {
        let p = 0, t = 0;
        state.groups.filter(g => g.classDays.some(d => d.toLowerCase() === dayOfWeek.toLowerCase())).forEach(group => {
            group.students.forEach(student => {
                t++;
                const s = state.attendance[group.id]?.[student.id]?.[todayStr];
                if (s === AttendanceStatus.Present || s === AttendanceStatus.Late || s === AttendanceStatus.Justified || s === AttendanceStatus.Exchange) p++;
            });
        });
        return { present: p, total: t };
    }, [state.groups, state.attendance, todayStr, dayOfWeek]);
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    const color = percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500';
    const circumference = 2 * Math.PI * 42;
    return (
        <div className="flex flex-col h-full divide-y divide-border-color/50">
            <div className="flex-1 grid grid-cols-2 gap-2 items-center p-3">
                <div className="flex flex-col items-center justify-center bg-indigo-50/50 rounded-xl p-1"><p className="text-lg sm:text-xl font-black text-indigo-700">{state.groups.length}</p><p className="text-[9px] text-indigo-900 font-black uppercase tracking-tighter truncate">Grupos</p></div>
                <div className="flex flex-col items-center justify-center bg-blue-50/50 rounded-xl p-1"><p className="text-lg sm:text-xl font-black text-blue-700">{totalStudents}</p><p className="text-[9px] text-blue-900 font-black uppercase tracking-tighter truncate">Alumnos</p></div>
            </div>
            <div className="flex-[2] flex flex-col items-center justify-center p-3">
                {total === 0 ? <div className="text-center opacity-40"><Icon name="calendar" className="w-8 h-8 mx-auto mb-1" /><p className="text-[10px] font-bold uppercase">Sin clases hoy</p></div> : (
                    <>
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percentage / 100)} className={`${color} transition-all duration-1000 ease-out shadow-sm`} style={{ strokeLinecap: 'round' }} />
                            </svg>
                            <span className={`text-base sm:text-lg font-black ${color}`}>{percentage}%</span>
                        </div>
                        <p className="text-[11px] font-extrabold text-text-primary mt-2 truncate tracking-tight">{present} de {total} alumnos</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default CombinedOverviewWidget;
