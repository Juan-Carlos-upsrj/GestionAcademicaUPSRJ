import React, { useState, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import { Student } from '../../types';
import Icon from '../icons/Icon';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
    onSelectStudent: (studentId: string, groupId: string) => void;
}

type SearchResult =
    | { type: 'student', id: string, title: string, subtitle: string, groupId: string, data: Student }
    | { type: 'group', id: string, title: string, subtitle: string, groupId: string }
    | { type: 'action', id: string, title: string, subtitle: string, action: () => void };

const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelectStudent }) => {
    const { state, dispatch } = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Toggle with Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Search Logic
    const results: SearchResult[] = React.useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        const res: SearchResult[] = [];

        // Search Students
        state.groups.forEach(group => {
            group.students.forEach(student => {
                if (student.name.toLowerCase().includes(lowerQuery) ||
                    student.matricula.toLowerCase().includes(lowerQuery)) {
                    res.push({
                        type: 'student',
                        id: student.id,
                        title: student.name,
                        subtitle: `${student.matricula} • ${group.name}`,
                        groupId: group.id,
                        data: student
                    });
                }
            });
        });

        // Search Groups
        state.groups.forEach(group => {
            if (group.name.toLowerCase().includes(lowerQuery)) {
                res.push({
                    type: 'group',
                    id: group.id,
                    title: group.name,
                    subtitle: 'Ir al grupo',
                    groupId: group.id
                });
            }
        });

        // Actions (Hardcoded for now)
        if ('asistencia'.includes(lowerQuery)) {
            res.push({ type: 'action', id: 'action-att', title: 'Tomar Asistencia', subtitle: 'Ir a vista de asistencia', action: () => { navigate('/attendance'); } });
        }
        if ('calificaciones'.includes(lowerQuery)) {
            res.push({ type: 'action', id: 'action-grades', title: 'Ver Calificaciones', subtitle: 'Ir a vista de calificaciones', action: () => { navigate('/grades'); } });
        }

        return res.slice(0, 10); // Limit results
    }, [query, state.groups, navigate]);

    // Keyboard Navigation in List
    useEffect(() => {
        const handleListNav = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
            }
        };
        window.addEventListener('keydown', handleListNav);
        return () => window.removeEventListener('keydown', handleListNav);
    }, [isOpen, results, selectedIndex]);

    const handleSelect = (item: SearchResult) => {
        if (item.type === 'student') {
            onSelectStudent(item.id, item.groupId);
            setIsOpen(false);
        } else if (item.type === 'group') {
            dispatch({ type: 'SET_SELECTED_GROUP', payload: item.groupId });
            navigate('/groups'); // or wherever group view is
            setIsOpen(false);
        } else if (item.type === 'action') {
            item.action();
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
            >
                <div className="flex items-center px-4 py-3 border-b border-slate-100">
                    <Icon name="search" className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 text-lg outline-none placeholder:text-slate-400 bg-transparent text-slate-800"
                        placeholder="Buscar alumno, grupo o acción..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">
                        ESC
                    </div>
                </div>

                {results.length > 0 && (
                    <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
                        {results.map((item, index) => (
                            <div
                                key={item.id}
                                className={`px-4 py-3 flex items-center cursor-pointer transition-colors ${index === selectedIndex ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${index === selectedIndex ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <Icon name={item.type === 'student' ? 'user' : item.type === 'group' ? 'users' : 'check-square'} className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className={`text-sm font-medium ${index === selectedIndex ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        {item.title}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {item.subtitle}
                                    </div>
                                </div>
                                {index === selectedIndex && (
                                    <div className="ml-auto text-xs text-indigo-500 font-medium">
                                        ↵ Enter
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {query && results.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        <Icon name="help-circle" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No se encontraron resultados para "{query}"</p>
                    </div>
                )}

                {!query && (
                    <div className="px-4 py-8 text-center text-slate-400 text-sm">
                        <p>Escribe para buscar en toda la aplicación.</p>
                    </div>
                )}
            </motion.div>
        </div>,
        document.body
    );
};

export default CommandPalette;
