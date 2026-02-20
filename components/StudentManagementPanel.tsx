import React, { useState, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../context/AppContext';
import { Student, Group } from '../types';
import Icon from './icons/Icon';
import Modal from './common/Modal';

interface StudentManagementPanelProps {
    group: Group;
    searchTerm?: string;
}

const StudentManagementPanel: React.FC<StudentManagementPanelProps> = ({ group, searchTerm = '' }) => {
    const { dispatch } = useContext(AppContext);

    // Form state
    const [name, setName] = useState('');
    const [matricula, setMatricula] = useState('');
    const [nickname, setNickname] = useState('');
    const [team, setTeam] = useState('');
    const [teamCoyote, setTeamCoyote] = useState('');
    const [isRepeating, setIsRepeating] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false); // Modal state

    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter students based on search term
    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return group.students;
        const lowerTerm = searchTerm.toLowerCase();
        return group.students.filter(s =>
            s.name.toLowerCase().includes(lowerTerm) ||
            s.matricula.toLowerCase().includes(lowerTerm) ||
            s.nickname?.toLowerCase().includes(lowerTerm) ||
            s.team?.toLowerCase().includes(lowerTerm) ||
            s.teamCoyote?.toLowerCase().includes(lowerTerm)
        );
    }, [group.students, searchTerm]);

    const handleSaveStudent = () => {
        if (!name.trim()) return;

        const studentData: Student = {
            id: editingId || uuidv4(),
            name: name.trim().toUpperCase(),
            matricula: matricula.trim(),
            nickname: nickname.trim() || undefined,
            team: team.trim() || undefined,
            teamCoyote: teamCoyote.trim() || undefined,
            isRepeating: isRepeating || undefined
        };

        dispatch({
            type: 'SAVE_STUDENT',
            payload: { groupId: group.id, student: studentData }
        });

        dispatch({
            type: 'ADD_TOAST',
            payload: {
                message: editingId ? 'Alumno actualizado' : 'Alumno agregado correctamente',
                type: 'success'
            }
        });

        handleCloseModal();
    };

    const handleDeleteStudent = (studentId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (confirm('¿Estás seguro de eliminar este alumno? Se perderán sus calificaciones.')) {
            dispatch({
                type: 'DELETE_STUDENT',
                payload: { groupId: group.id, studentId }
            });
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Alumno eliminado', type: 'info' } });
        }
    };

    const startEditing = (student: Student) => {
        setEditingId(student.id);
        setName(student.name);
        setMatricula(student.matricula || '');
        setNickname(student.nickname || '');
        setTeam(student.team || '');
        setTeamCoyote(student.teamCoyote || '');
        setIsRepeating(student.isRepeating || false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setEditingId(null);
            setName('');
            setMatricula('');
            setNickname('');
            setTeam('');
            setTeamCoyote('');
            setIsRepeating(false);
        }, 200);
    };

    return (
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl rounded-[2.5rem] p-6 h-full flex flex-col relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Icon name="users" className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Gestión de Alumnos</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {filteredStudents.length !== group.students.length
                                ? `${filteredStudents.length} de ${group.students.length} Alumnos`
                                : `${group.students.length} Alumnos en ${group.name}`
                            }
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all p-2 rounded-xl"
                    title="Agregar Alumno"
                >
                    <Icon name="plus" className="w-5 h-5" />
                </button>
            </div>

            {/* LISTA DE ALUMNOS VIRTUALIZADA */}
            <div className="flex-1 overflow-hidden pr-2">
                {filteredStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                        <Icon name="users" className="w-16 h-16 mb-4 stroke-1" />
                        <p className="text-sm font-bold uppercase tracking-widest">{searchTerm ? 'No hay coincidencias' : 'Lista Vacía'}</p>
                        {!searchTerm && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="mt-4 text-primary text-xs font-bold hover:underline"
                            >
                                Registrar primer alumno
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto custom-scrollbar pr-4 pb-8">
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
                            {filteredStudents.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => startEditing(s)}
                                    className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 hover:border-primary/30 hover:shadow-md cursor-pointer transition-all group min-h-[76px]"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-inner flex-shrink-0 ${s.isRepeating ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                            {group.students.indexOf(s) + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-700 truncate uppercase tracking-tight">
                                                {s.name}
                                            </p>
                                            <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400 mt-1">
                                                {s.matricula && <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">#{s.matricula}</span>}
                                                {s.nickname && <span className="text-primary bg-primary/5 px-1.5 py-0.5 rounded">"{s.nickname}"</span>}
                                                {s.team && <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1"><Icon name="users" className="w-2.5 h-2.5" /> {s.team}</span>}
                                                {s.teamCoyote && <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1"><Icon name="users" className="w-2.5 h-2.5" /> {s.teamCoyote} (C)</span>}
                                                {s.isRepeating && <span className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">R</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                                        <button
                                            onClick={(e) => handleDeleteStudent(s.id, e)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                        >
                                            <Icon name="trash-2" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL FORMULARIO */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Editar Alumno' : 'Nuevo Alumno'}
                size="2xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12">
                            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Nombre Completo</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="APELLIDOS NOMBRE"
                                className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold uppercase focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleSaveStudent()}
                            />
                        </div>

                        <div className="col-span-6 md:col-span-4">
                            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Matrícula</label>
                            <input
                                value={matricula}
                                onChange={e => setMatricula(e.target.value)}
                                placeholder="Ej. 123456"
                                className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-center focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                onKeyDown={e => e.key === 'Enter' && handleSaveStudent()}
                            />
                        </div>
                        <div className="col-span-6 md:col-span-4">
                            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Apodo</label>
                            <input
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                placeholder="Corto"
                                className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-center focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                onKeyDown={e => e.key === 'Enter' && handleSaveStudent()}
                            />
                        </div>
                        <div className="col-span-12 md:col-span-4 flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer select-none w-full p-3 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isRepeating ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300 bg-white'}`}>
                                    {isRepeating && <Icon name="check" className="w-3.5 h-3.5" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isRepeating}
                                    onChange={e => setIsRepeating(e.target.checked)}
                                    className="hidden"
                                />
                                <span className="text-xs font-black uppercase text-slate-500">Es Recursamiento</span>
                            </label>
                        </div>

                        <div className="col-span-6">
                            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Equipo Base</label>
                            <input
                                value={team}
                                onChange={e => setTeam(e.target.value)}
                                placeholder="Nombre del Equipo"
                                className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-center uppercase focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                onKeyDown={e => e.key === 'Enter' && handleSaveStudent()}
                            />
                        </div>
                        <div className="col-span-6">
                            <label className="block text-xs font-black uppercase text-slate-400 mb-1 ml-1">Equipo Coyote</label>
                            <input
                                value={teamCoyote}
                                onChange={e => setTeamCoyote(e.target.value)}
                                placeholder="Nombre del Equipo"
                                className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-center uppercase focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                onKeyDown={e => e.key === 'Enter' && handleSaveStudent()}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={handleCloseModal}
                            className="flex-1 p-3 rounded-xl border-2 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all font-bold text-xs uppercase"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveStudent}
                            disabled={!name.trim()}
                            className={`flex-[2] p-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-lg ${!name.trim() ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-primary text-white shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5'}`}
                        >
                            <Icon name={editingId ? "check" : "plus"} className="w-5 h-5" />
                            {editingId ? 'Guardar Cambios' : 'Agregar Alumno'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StudentManagementPanel;
