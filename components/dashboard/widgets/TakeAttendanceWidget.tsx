import React, { useContext } from 'react';
import { AppContext } from '../../../context/AppContext';
import { Group } from '../../../types';
import { GROUP_COLORS } from '../../../constants';
import Icon from '../../icons/Icon';
import { motion } from 'framer-motion';

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

export default TakeAttendanceWidget;
