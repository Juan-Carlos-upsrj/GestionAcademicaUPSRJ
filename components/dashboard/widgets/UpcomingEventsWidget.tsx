import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../../context/AppContext';

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

export default UpcomingEventsWidget;
