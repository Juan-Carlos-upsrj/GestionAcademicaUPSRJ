import React, { useContext, useMemo, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { AppContext } from '../context/AppContext';
import { Group, AttendanceStatus } from '../types';
import Icon from './icons/Icon';
import BirthdayCelebration from './BirthdayCelebration';
import { PROFESSOR_BIRTHDAYS, GROUP_COLORS } from '../constants';
import Modal from './common/Modal';
import AttendanceTaker from './AttendanceTaker';
import { motion } from 'framer-motion';
import { syncAttendanceData } from '../services/syncService';
import Button from './common/Button';
import SemesterTransitionModal from './SemesterTransitionModal';
import TeacherScheduleModal from './dashboard/TeacherScheduleModal';

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- COMPONENTE HORARIO ---



// --- WIDGETS ---

const WelcomeWidget: React.FC<{ dateString: string }> = ({ dateString }) => {
    const { state } = useContext(AppContext);
    return (
        <div className="flex flex-col justify-center h-full px-4" id="dashboard-welcome-widget">
            <h3 className="font-extrabold text-xl sm:text-2xl mb-1 text-primary truncate tracking-tight">¡Hola, {state.settings.professorName}!</h3>
            <p className="text-sm text-text-secondary font-medium capitalize opacity-80">{dateString}</p>
        </div>
    );
};

const UpcomingEventsWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sortedEvents = state.gcalEvents
            .filter(event => new Date(event.date + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sortedEvents.length === 0) return [];
        const grouped = sortedEvents.reduce((acc, event) => {
            const lastEvent = acc[acc.length - 1];
            if (lastEvent && lastEvent.title === event.title) {
                const lastEndDate = new Date(lastEvent.endDate + 'T00:00:00');
                lastEndDate.setDate(lastEndDate.getDate() + 1);
                if (new Date(event.date + 'T00:00:00').getTime() === lastEndDate.getTime()) {
                    lastEvent.endDate = event.date; return acc;
                }
            }
            acc.push({ id: event.id, title: event.title, startDate: event.date, endDate: event.date });
            return acc;
        }, [] as { id: string; title: string; startDate: string; endDate: string; }[]);
        return grouped.slice(0, 4);
    }, [state.gcalEvents]);

    if (upcomingEvents.length === 0) return <p className="text-text-secondary text-center flex items-center justify-center h-full opacity-60 text-xs">Sin eventos programados.</p>;

    return (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto h-full pr-1 content-start py-1">
            {upcomingEvents.map(event => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const startDate = new Date(event.startDate + 'T00:00:00'), endDate = new Date(event.endDate + 'T00:00:00');
                const diffInDays = (d1: Date, d2: Date) => Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
                const startDiff = diffInDays(startDate, today), endDiff = diffInDays(endDate, today);
                const isOngoing = startDiff <= 0 && endDiff >= 0;
                let colorClass = 'bg-surface-secondary/50 border border-border-color';
                if (isOngoing && endDiff <= 2) colorClass = 'bg-accent-red-light border border-accent-red/30';
                else if (!isOngoing && startDiff <= 7) colorClass = 'bg-accent-yellow-light border border-accent-yellow/30';
                const dateString = startDate.getTime() === endDate.getTime() ? startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : `${startDate.getDate()} - ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
                return (
                    <li key={event.id} className={`text-[11px] p-3 rounded-xl transition-all shadow-sm flex flex-col justify-center hover:shadow-md ${colorClass}`}>
                        <p className="font-bold text-text-primary leading-tight truncate">{event.title}</p>
                        <p className="text-[10px] text-text-secondary capitalize mt-1 font-medium">{dateString}</p>
                    </li>
                );
            })}
        </ul>
    );
};

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

const QuickActionsWidget: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    return (
        <div className="flex flex-col gap-3 h-full justify-center px-4">
            <Button
                onClick={() => syncAttendanceData(state, dispatch, 'today')}
                variant="primary"
                size="md"
                className="w-full shadow-lg"
            >
                <Icon name="upload-cloud" className="w-5 h-5" />
                <span className="truncate font-black">Sincronizar Hoy</span>
            </Button>
        </div>
    );
};

const TakeAttendanceWidget: React.FC<{ onTakeAttendance: (group: Group) => void }> = ({ onTakeAttendance }) => {
    const { state } = useContext(AppContext);
    const dayOfWeek = new Date().toLocaleDateString('es-ES', { weekday: 'long' });
    const todaysClasses = state.groups.filter(g => g.classDays.some(d => d.toLowerCase() === dayOfWeek.toLowerCase()));
    if (todaysClasses.length === 0) return <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-40"><Icon name="calendar" className="w-10 h-10 mb-2" /><p className="text-xs font-bold uppercase tracking-widest">Día de descanso</p></div>;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto h-full content-start pr-1 py-1" id="dashboard-attendance-widget">
            {todaysClasses.map(group => {
                const colorObj = GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0];
                return (
                    <motion.button key={group.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onTakeAttendance(group)} className={`rounded-xl flex items-center justify-start gap-3 p-3 text-left shadow-md w-full transition-all border border-white/10 ${colorObj.bg} ${colorObj.text}`}>
                        <div className="bg-white/20 p-2 rounded-lg shrink-0 shadow-inner"><Icon name="list-checks" className="w-5 h-5" /></div>
                        <div className="min-w-0 overflow-hidden"><p className="font-black text-sm leading-tight truncate">{group.name}</p><p className="text-[10px] opacity-80 font-bold uppercase tracking-tighter truncate">{group.subject}</p></div>
                    </motion.button>
                );
            })}
        </div>
    );
};

const WidgetWrapper: React.FC<{ title: string; children: React.ReactNode; autoHeight?: boolean; id?: string }> = ({ title, children, autoHeight = false, id }) => (
    <div id={id} className="bg-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/60 dark:border-slate-700/50 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {title && <h3 className="font-black text-[10px] text-text-secondary mb-3 uppercase tracking-[0.15em] shrink-0 truncate opacity-70">{title}</h3>}
        <div className={!autoHeight ? "flex-grow overflow-hidden" : ""}>{children}</div>
    </div>
);

const Dashboard: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const [isTakerOpen, setTakerOpen] = useState(false);
    const [attendanceGroup, setAttendanceGroup] = useState<Group | null>(null);
    const [isTransitionOpen, setTransitionOpen] = useState(false);
    const [isScheduleOpen, setScheduleOpen] = useState(false);
    const [today, setToday] = useState(new Date());
    const [birthdayPerson, setBirthdayPerson] = useState<string | null>(null);

    React.useEffect(() => {
        const timer = setInterval(() => setToday(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    React.useEffect(() => {
        const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const birthday = PROFESSOR_BIRTHDAYS.find(p => p.birthdate === todayStr);
        setBirthdayPerson(birthday ? birthday.name : null);
    }, [today]);

    const dateString = today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const handleTakeAttendance = (group: Group) => { setAttendanceGroup(group); setTakerOpen(true); };

    // Balanced grid layout for 3 columns
    const layouts = {
        lg: [{ i: 'welcome', x: 0, y: 0, w: 2, h: 1 }, { i: 'quick-actions', x: 2, y: 0, w: 1, h: 1 }, { i: 'take-attendance', x: 0, y: 1, w: 2, h: 2 }, { i: 'combined-overview', x: 2, y: 1, w: 1, h: 3 }, { i: 'upcoming-events', x: 0, y: 3, w: 2, h: 1 }],
        md: [{ i: 'welcome', x: 0, y: 0, w: 2, h: 1 }, { i: 'quick-actions', x: 2, y: 0, w: 1, h: 1 }, { i: 'take-attendance', x: 0, y: 1, w: 2, h: 2 }, { i: 'combined-overview', x: 2, y: 1, w: 1, h: 3 }, { i: 'upcoming-events', x: 0, y: 3, w: 2, h: 1 }],
        sm: [{ i: 'welcome', x: 0, y: 0, w: 2, h: 1 }, { i: 'quick-actions', x: 0, y: 1, w: 2, h: 1 }, { i: 'take-attendance', x: 0, y: 2, w: 2, h: 2 }, { i: 'combined-overview', x: 0, y: 4, w: 2, h: 2 }, { i: 'upcoming-events', x: 0, y: 6, w: 2, h: 1 }],
        xs: [{ i: 'welcome', x: 0, y: 0, w: 1, h: 1 }, { i: 'quick-actions', x: 0, y: 1, w: 1, h: 1 }, { i: 'take-attendance', x: 0, y: 2, w: 1, h: 2 }, { i: 'combined-overview', x: 0, y: 4, w: 1, h: 2 }, { i: 'upcoming-events', x: 0, y: 6, w: 1, h: 1 }],
        xxs: [{ i: 'welcome', x: 0, y: 0, w: 1, h: 1 }, { i: 'quick-actions', x: 0, y: 1, w: 1, h: 1 }, { i: 'take-attendance', x: 0, y: 2, w: 1, h: 2 }, { i: 'combined-overview', x: 0, y: 4, w: 1, h: 2 }, { i: 'upcoming-events', x: 0, y: 6, w: 1, h: 1 }],
    };

    return (
        <div className="w-full relative h-full overflow-x-hidden">
            <BirthdayCelebration name={birthdayPerson || ''} show={!!birthdayPerson} />
            <ResponsiveGridLayout
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
                rowHeight={110}
                isDraggable={false}
                isResizable={false}
                margin={[15, 15]}
                useCSSTransforms={true}
            >
                <div key="welcome"><WidgetWrapper title=""><WelcomeWidget dateString={dateString} /></WidgetWrapper></div>
                <div key="take-attendance"><WidgetWrapper id="dashboard-attendance-widget" title="Pase de Lista Hoy"><TakeAttendanceWidget onTakeAttendance={handleTakeAttendance} /></WidgetWrapper></div>
                <div key="combined-overview"><WidgetWrapper id="dashboard-combined-overview" title="Resumen General"><CombinedOverviewWidget todayStr={todayStr} /></WidgetWrapper></div>
                <div key="upcoming-events"><WidgetWrapper id="dashboard-upcoming-events" title="Próximos Eventos"><UpcomingEventsWidget /></WidgetWrapper></div>
                <div key="quick-actions"><WidgetWrapper id="dashboard-quick-actions" title="Acciones Rápidas"><QuickActionsWidget /></WidgetWrapper></div>
            </ResponsiveGridLayout>

            {/* BOTÓN FLOTANTE HORARIO (ESQUINA INFERIOR DERECHA) */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setScheduleOpen(true)}
                className="fixed bottom-6 right-6 z-[40] w-14 h-14 bg-primary text-white rounded-full shadow-[0_10px_30px_rgba(59,130,246,0.5)] flex items-center justify-center hover:bg-primary-hover transition-colors border-2 border-white/20 sm:w-16 sm:h-16"
                title="Ver mi horario completo"
            >
                <Icon name="calendar" className="w-6 h-6 sm:w-7 sm:h-7" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red rounded-full border-2 border-white animate-pulse flex items-center justify-center text-[9px] font-bold sm:w-5 sm:h-5 sm:text-[10px]">!</div>
            </motion.button>

            {attendanceGroup && (<Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase: ${attendanceGroup.name}`}><AttendanceTaker students={attendanceGroup.students} date={todayStr} groupAttendance={state.attendance[attendanceGroup.id] || {}} onStatusChange={(sid, s) => dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: attendanceGroup.id, studentId: sid, date: todayStr, status: s } })} onClose={() => setTakerOpen(false)} /></Modal>)}
            <SemesterTransitionModal isOpen={isTransitionOpen} onClose={() => setTransitionOpen(false)} />
            <TeacherScheduleModal schedule={state.teacherSchedule || []} isOpen={isScheduleOpen} onClose={() => setScheduleOpen(false)} />
        </div>
    );
};

export default Dashboard;