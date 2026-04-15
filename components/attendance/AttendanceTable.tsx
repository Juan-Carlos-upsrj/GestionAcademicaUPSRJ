import React, { useContext, createContext } from 'react';
import { AttendanceStatus, Student } from '../../types';
import { STATUS_STYLES } from '../../constants';
// @ts-ignore
import * as ReactWindow from 'react-window';
// @ts-ignore
import type { ListChildComponentProps } from 'react-window';
// @ts-ignore
import AutoSizer from 'react-virtualized-auto-sizer';

// Robust import for FixedSizeList
export const List = (ReactWindow as any).FixedSizeList || ReactWindow.FixedSizeList;

// --- CONSTANTS & CONFIG ---
export const DATE_COL_WIDTH = 45;
export const STAT_COL_WIDTH = 60;
export const ROW_HEIGHT = 38;
export const HEADER_HEIGHT = 96; // 32px * 3 rows

export interface Coords { r: number; c: number; }
export type StatDisplayMode = 'percent' | 'absences';

export interface AttendanceContextValue {
    students: Student[];
    classDates: string[];
    attendance: any;
    groupId: string;
    focusedCell: Coords | null;
    selection: { start: Coords | null; end: Coords | null; isDragging: boolean };
    todayStr: string;
    headerStructure: any[];
    totalWidth: number;
    nameColWidth: number;
    displayMode: StatDisplayMode;
    threshold: number;
    handleStatusChange: (studentId: string, date: string, status: AttendanceStatus) => void;
    onMouseDown: (r: number, c: number) => void;
    onMouseEnter: (r: number, c: number) => void;
    precalcStats: any[];
    limits: { p1: number; p2: number; global: number };
    isCurrentP1: boolean;
    isCurrentP2: boolean;
}

export const AttendanceInternalContext = createContext<AttendanceContextValue | null>(null);

export const StickyHeader = () => {
    const context = useContext(AttendanceInternalContext);
    if (!context) return null;
    const { headerStructure, classDates, totalWidth, precalcStats, nameColWidth, displayMode, todayStr } = context;

    const globalP1Avg = Math.round(precalcStats.reduce((acc, s) => acc + s.p1.percent, 0) / (precalcStats.length || 1));
    const globalP2Avg = Math.round(precalcStats.reduce((acc, s) => acc + s.p2.percent, 0) / (precalcStats.length || 1));
    const globalTotalAvg = Math.round(precalcStats.reduce((acc, s) => acc + s.global.percent, 0) / (precalcStats.length || 1));

    const labelPrefix = displayMode === 'percent' ? '%' : 'F.';

    return (
        <div
            className="absolute top-0 left-0 z-[100] bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 shadow-sm"
            style={{ width: totalWidth, height: HEADER_HEIGHT }}
        >
            <div className="flex h-8 w-full border-b border-slate-300 dark:border-slate-700">
                <div className="sticky left-0 z-[110] bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 flex items-center px-2 font-bold text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ width: nameColWidth }}>
                    Periodo
                </div>
                {headerStructure.map((part: any, i: number) => (
                    <div key={i} className="flex items-center justify-center border-r border-slate-300 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800/80 font-bold text-[10px] text-slate-600 dark:text-slate-300 uppercase truncate px-1" style={{ width: part.width }}>
                        {part.label}
                    </div>
                ))}
                <div className="sticky right-0 z-[110] flex">
                    <div className="bg-amber-50 dark:bg-amber-900/40 border-l border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[10px] text-amber-700 dark:text-amber-400" style={{ width: STAT_COL_WIDTH * 2 }}>PARCIALES</div>
                    <div className="bg-slate-100 dark:bg-slate-800 border-l border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300" style={{ width: STAT_COL_WIDTH }}>TOTAL</div>
                </div>
            </div>

            <div className="flex h-8 w-full border-b border-slate-300 dark:border-slate-700">
                <div className="sticky left-0 z-[110] bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 flex items-center px-2 font-bold text-[10px] text-slate-600 dark:text-slate-400 uppercase" style={{ width: nameColWidth }}>
                    Mes
                </div>
                {headerStructure.flatMap((part: any) => part.months.map((month: any, j: number) => (
                    <div key={`${part.label}-${j}`} className="flex items-center justify-center border-r border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold text-[9px] text-slate-500 dark:text-slate-400 uppercase truncate px-1" style={{ width: month.width }}>
                        {month.label}
                    </div>
                )))}
                <div className="sticky right-0 z-[110] flex">
                    <div className="bg-amber-50 dark:bg-amber-900/40 border-l border-slate-300 dark:border-slate-700" style={{ width: STAT_COL_WIDTH * 2 }}></div>
                    <div className="bg-slate-100 dark:bg-slate-800 border-l border-slate-300 dark:border-slate-700" style={{ width: STAT_COL_WIDTH }}></div>
                </div>
            </div>

            <div className="flex h-8 w-full border-b border-transparent dark:border-slate-700">
                <div className="sticky left-0 z-[110] bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 flex items-center px-2" style={{ width: nameColWidth }}>
                    <span className="font-bold text-[11px] sm:text-sm text-slate-700 dark:text-slate-200">Alumno</span>
                </div>
                {classDates.map(date => {
                    const isToday = date === todayStr;
                    const d = new Date(date + 'T00:00:00');
                    return (
                        <div key={date} className={`flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-700 flex-shrink-0 ${isToday ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`} style={{ width: DATE_COL_WIDTH }}>
                            <span className="text-[10px] leading-none font-bold">{d.getDate()}</span>
                            <span className="text-[8px] leading-none uppercase">{d.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}</span>
                        </div>
                    );
                })}
                <div className="sticky right-0 z-[110] flex">
                    <div className="bg-amber-50 dark:bg-amber-900/40 border-l border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-[8px] font-bold text-amber-800 dark:text-amber-400" style={{ width: STAT_COL_WIDTH }}>
                        <span>{labelPrefix} P1</span>
                        <span className="text-[7px] opacity-70 dark:opacity-60">({isNaN(globalP1Avg) ? '-' : globalP1Avg}%)</span>
                    </div>
                    <div className="bg-sky-50 dark:bg-sky-900/40 border-l border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-[8px] font-bold text-sky-800 dark:text-sky-400" style={{ width: STAT_COL_WIDTH }}>
                        <span>{labelPrefix} P2</span>
                        <span className="text-[7px] opacity-70 dark:opacity-60">({isNaN(globalP2Avg) ? '-' : globalP2Avg}%)</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 border-l border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-[8px] font-bold text-slate-800 dark:text-slate-300" style={{ width: STAT_COL_WIDTH }}>
                        <span>Global</span>
                        <span className="text-[7px] opacity-70 dark:opacity-60">({isNaN(globalTotalAvg) ? '-' : globalTotalAvg}%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InnerElement = React.forwardRef(({ children, style, ...rest }: any, ref) => {
    const context = useContext(AttendanceInternalContext);
    if (!context) return null;
    const h = parseFloat(style.height) + HEADER_HEIGHT;
    const w = context.totalWidth;
    return (
        <div ref={ref} {...rest} style={{ ...style, height: h, width: w, position: 'relative' }}>
            <StickyHeader />
            {children}
        </div>
    );
});

export const Row = React.memo(({ index, style }: ListChildComponentProps) => {
    const context = useContext(AttendanceInternalContext);
    if (!context) return null;
    const {
        students, attendance, groupId,
        focusedCell, selection, todayStr, totalWidth,
        onMouseDown, onMouseEnter, precalcStats, nameColWidth,
        displayMode, threshold, limits, isCurrentP1, isCurrentP2, classDates
    } = context;

    const student = students[index];
    if (!student) return null;

    const studentAttendance = attendance[groupId]?.[student.id] || {};
    const { p1, p2, global } = precalcStats[index];
    const top = parseFloat((style.top ?? 0).toString()) + HEADER_HEIGHT;

    const isBaja = global.absences > limits.global;
    const isRisk = !isBaja && ((isCurrentP1 && p1.absences > limits.p1) || (isCurrentP2 && p2.absences > limits.p2));

    const getScoreColor = (pct: number) => pct >= threshold ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' : pct >= 70 ? 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10';

    const formatValue = (stat: { percent: number, absences: number }) => {
        return displayMode === 'percent' ? `${stat.percent}%` : stat.absences;
    };

    return (
        <div
            className={`flex items-center border-b border-slate-200 dark:border-slate-800 transition-colors box-border ${isBaja ? 'bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100/50 dark:hover:bg-rose-900/20' : isRisk ? 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20' : 'bg-white dark:bg-slate-900 hover:bg-blue-50/30 dark:hover:bg-blue-900/20'}`}
            style={{ ...style, top, height: ROW_HEIGHT, width: totalWidth, zIndex: 1 }}
        >
            <div
                className={`sticky left-0 z-[50] border-r border-slate-300 dark:border-slate-700 flex items-center px-2 h-full ${isBaja ? 'bg-rose-100 dark:bg-rose-900/30' : isRisk ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-white dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-none'}`}
                style={{ width: nameColWidth }}
            >
                <div className="truncate w-full relative z-10 flex flex-col">
                    <div className="flex items-center">
                        <span className="text-[10px] font-black text-slate-400 mr-1 w-4 inline-block text-right">{index + 1}.</span>
                        <span className={`font-bold text-[11px] sm:text-xs truncate ${isBaja ? 'text-rose-700 dark:text-rose-400' : isRisk ? 'text-amber-700 dark:text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>{student.name}</span>
                        {isBaja ? (
                            <span className="ml-2 text-[8px] bg-rose-600 dark:bg-rose-700 text-white px-1.5 py-0.5 rounded-full font-black shadow-sm">BAJA</span>
                        ) : isRisk ? (
                            <span className="ml-2 text-[8px] bg-amber-500 dark:bg-amber-600 text-white px-1.5 py-0.5 rounded-full font-black shadow-sm">RIESGO</span>
                        ) : null}
                    </div>
                    {student.nickname && <span className="text-[9px] text-primary italic font-bold ml-5 leading-none mt-0.5 truncate">"{student.nickname}"</span>}
                </div>
            </div>

            {classDates.map((date, colIndex) => {
                const status = (studentAttendance[date] || AttendanceStatus.Pending) as AttendanceStatus;
                const isFocused = focusedCell?.r === index && focusedCell?.c === colIndex;
                let isSelected = false;
                if (selection.start && selection.end) {
                    const minR = Math.min(selection.start.r, selection.end.r);
                    const maxR = Math.max(selection.start.r, selection.end.r);
                    const minC = Math.min(selection.start.c, selection.end.c);
                    const maxC = Math.max(selection.start.c, selection.end.c);
                    isSelected = index >= minR && index <= maxR && colIndex >= minC && colIndex <= maxC;
                }

                return (
                    <div
                        key={date}
                        className={`flex items-center justify-center border-r border-slate-200 dark:border-slate-800 h-full cursor-pointer select-none relative z-0 ${date === todayStr ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''} ${isSelected ? '!bg-blue-100 dark:!bg-blue-900/50 ring-1 ring-blue-400 dark:ring-blue-500 ring-inset' : ''}`}
                        style={{ width: DATE_COL_WIDTH }}
                        onMouseDown={() => onMouseDown(index, colIndex)}
                        onMouseEnter={() => onMouseEnter(index, colIndex)}
                    >
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-transform ${STATUS_STYLES[status].color} ${isFocused ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-900 scale-110 z-10' : ''}`}>
                            {STATUS_STYLES[status].symbol}
                        </div>
                    </div>
                );
            })}

            <div className="sticky right-0 z-[50] flex h-full shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] dark:shadow-none">
                <div className={`border-l border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-black ${getScoreColor(p1.percent)}`} style={{ width: STAT_COL_WIDTH }}>{formatValue(p1)}</div>
                <div className={`border-l border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-black ${getScoreColor(p2.percent)}`} style={{ width: STAT_COL_WIDTH }}>{formatValue(p2)}</div>
                <div className={`border-l border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-black ${getScoreColor(global.percent)}`} style={{ width: STAT_COL_WIDTH }}>{formatValue(global)}</div>
            </div>
        </div>
    );
});
