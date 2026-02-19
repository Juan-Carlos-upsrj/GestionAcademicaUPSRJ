import React, { useEffect, useState } from 'react';
import Icon from './icons/Icon';
import Button from './common/Button';

interface Course {
    id: string;
    name: string;
    section?: string;
    descriptionHeading?: string;
    alternateLink: string;
}

interface ClassroomSelectorProps {
    onSelect: (course: Course) => void;
    onCancel: () => void;
    currentLinkedId?: string;
    tokens?: any;
}

const ClassroomSelector: React.FC<ClassroomSelectorProps> = ({ onSelect, onCancel, currentLinkedId, tokens }) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                // @ts-ignore
                const fetchedCourses = await window.electronAPI.listCourses(tokens); // Main process handles token retrieval from store if needed
                if (fetchedCourses) {
                    setCourses(fetchedCourses);
                } else {
                    setError("No se pudieron cargar los cursos.");
                }
                setLoading(false);
            } catch (err: any) {
                console.error("Error fetching courses:", err);
                setError("Error al cargar cursos. Asegúrate de haber iniciado sesión con Google.");
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    return (
        <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                        <Icon name="loader" className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest">Cargando cursos de Classroom...</span>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-3">
                        <Icon name="alert-triangle" className="w-8 h-8" />
                        <span className="text-xs font-bold text-center px-4">{error}</span>
                        <Button onClick={onCancel} variant="secondary" className="mt-2 text-xs">Cerrar</Button>
                    </div>
                )}

                {!loading && !error && courses.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                        <Icon name="book-open" className="w-8 h-8" />
                        <span className="text-xs font-bold uppercase tracking-widest">No tienes cursos activos</span>
                    </div>
                )}

                {!loading && !error && courses.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {courses.map(course => (
                            <button
                                key={course.id}
                                onClick={() => onSelect(course)}
                                className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all ${currentLinkedId === course.id
                                    ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                                    : 'border-slate-100 bg-white hover:border-primary/50 hover:shadow-md'
                                    }`}
                            >
                                <span className="text-xs font-black uppercase text-slate-700 truncate w-full mb-1">{course.name}</span>
                                {course.section && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{course.section}</span>}
                                {currentLinkedId === course.id && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase">
                                        <Icon name="check-circle" className="w-3 h-3" /> Vinculado
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
                <Button onClick={onCancel} variant="secondary" className="!rounded-xl text-xs">Cancelar</Button>
            </div>
        </div>
    );
};

export default ClassroomSelector;
