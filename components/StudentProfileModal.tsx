import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceStatus, Evaluation } from '../types';
import Modal from './common/Modal';
import Icon from './icons/Icon';
import Button from './common/Button';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string | null;
    groupId: string | null;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, studentId, groupId }) => {
    const { state, dispatch } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'attendance' | 'tutorship'>('overview');
    const [tutorshipNote, setTutorshipNote] = useState('');

    const group = useMemo(() => state.groups.find(g => g.id === groupId), [state.groups, groupId]);
    const student = useMemo(() => group?.students.find(s => s.id === studentId), [group, studentId]);

    // Derived data
    const studentAttendance = useMemo(() => {
        if (!groupId || !studentId) return {};
        return state.attendance[groupId]?.[studentId] || {};
    }, [state.attendance, groupId, studentId]);

    const studentGrades = useMemo(() => {
        if (!groupId || !studentId) return {};
        return state.grades[groupId]?.[studentId] || {};
    }, [state.grades, groupId, studentId]);

    const groupEvaluations = useMemo(() => {
        if (!groupId) return [];
        return state.evaluations[groupId] || [];
    }, [state.evaluations, groupId]);

    const tutorshipEntry = useMemo(() => {
        if (!studentId) return null;
        return state.tutorshipData[studentId];
    }, [state.tutorshipData, studentId]);

    // Helper to get evaluation weight
    const getEvaluationWeight = (ev: Evaluation) => {
        if (!group) return 0;
        const types = ev.partial === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2;
        const type = types.find(t => t.id === ev.typeId);
        return type ? type.weight : 0;
    };

    // Statistics
    const stats = useMemo(() => {
        const totalClasses = Object.keys(studentAttendance).length;
        const presentCount = Object.values(studentAttendance).filter(s => s === AttendanceStatus.Present || s === AttendanceStatus.Late).length;
        const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 100;

        let sumGrades = 0;
        let countGrades = 0;

        groupEvaluations.forEach(ev => {
            const grade = studentGrades[ev.id];
            if (grade !== undefined && grade !== null) {
                // Normalize to 10
                const normalized = (grade / ev.maxScore) * 10;
                sumGrades += normalized;
                countGrades++;
            }
        });

        const averageGrade = countGrades > 0 ? (sumGrades / countGrades) : 0;

        return { attendancePercentage, averageGrade };
    }, [studentAttendance, groupEvaluations, studentGrades]);

    const handleSaveTutorship = () => {
        if (!studentId) return;

        const currentEntry = state.tutorshipData[studentId] || { strengths: '', opportunities: '', summary: '' };

        dispatch({
            type: 'UPDATE_TUTORSHIP',
            payload: {
                studentId,
                entry: {
                    ...currentEntry,
                    summary: tutorshipNote || currentEntry.summary
                }
            }
        });
        onClose();
    };

    // Sync local state when modal opens
    React.useEffect(() => {
        if (tutorshipEntry) {
            setTutorshipNote(tutorshipEntry.summary);
        } else {
            setTutorshipNote('');
        }
    }, [tutorshipEntry, isOpen]);

    if (!student || !group) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Perfil del Estudiante" size="4xl">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar / Header Info */}
                <div className="md:w-1/3 flex flex-col items-center text-center p-4 bg-surface-secondary rounded-xl border border-border-color h-fit">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                        <Icon name="user" className="w-12 h-12" />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">{student.name}</h2>
                    <p className="text-text-secondary text-sm mb-1">{student.matricula}</p>
                    <div className="mt-2 px-3 py-1 bg-white rounded-full text-xs border border-border-color shadow-sm">
                        {group.name}
                    </div>
                    {student.team && (
                        <div className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs border border-indigo-100">
                            Team: {student.team}
                        </div>
                    )}

                    <div className="w-full grid grid-cols-2 gap-2 mt-6">
                        <div className="p-2 bg-white rounded-lg border border-border-color">
                            <div className="text-xs text-text-secondary uppercase font-bold">Promedio</div>
                            <div className={`text-xl font-bold ${stats.averageGrade < 7 ? 'text-red-500' : 'text-green-600'}`}>
                                {stats.averageGrade.toFixed(1)}
                            </div>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-border-color">
                            <div className="text-xs text-text-secondary uppercase font-bold">Asistencia</div>
                            <div className={`text-xl font-bold ${stats.attendancePercentage < 80 ? 'text-red-500' : 'text-green-600'}`}>
                                {stats.attendancePercentage.toFixed(0)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="flex border-b border-border-color mb-4">
                        <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Resumen</button>
                        <button onClick={() => setActiveTab('grades')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'grades' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Calificaciones</button>
                        <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Asistencia</button>
                        <button onClick={() => setActiveTab('tutorship')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tutorship' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Tutoría</button>
                    </div>

                    <div className="min-h-[300px]">
                        {activeTab === 'overview' && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg">Información General</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 bg-surface border border-border-color rounded-lg flex justify-between items-center">
                                        <span className="text-text-secondary">Estatus</span>
                                        <span className="font-medium text-green-600">Activo</span>
                                    </div>
                                    <div className="p-3 bg-surface border border-border-color rounded-lg flex justify-between items-center">
                                        <span className="text-text-secondary">Evaluaciones Completadas</span>
                                        <span className="font-medium">{Object.keys(studentGrades).length} / {groupEvaluations.length}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'grades' && (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {groupEvaluations.length === 0 ? (
                                    <p className="text-text-secondary italic">No hay evaluaciones registradas.</p>
                                ) : (
                                    groupEvaluations.map(ev => (
                                        <div key={ev.id} className="flex justify-between items-center p-3 bg-surface border border-border-color rounded-lg hover:bg-surface-secondary transition-colors">
                                            <div>
                                                <div className="font-medium text-text-primary">{ev.name}</div>
                                                <div className="text-xs text-text-secondary">Parcial {ev.partial} • {getEvaluationWeight(ev)}%</div>
                                            </div>
                                            <div className="font-bold text-lg">
                                                {studentGrades[ev.id] !== undefined ? studentGrades[ev.id] : '-'}
                                                <span className="text-xs text-text-secondary font-normal ml-1">/ {ev.maxScore}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.keys(studentAttendance).length === 0 ? (
                                    <p className="text-text-secondary italic">No hay registros de asistencia.</p>
                                ) : (
                                    Object.entries(studentAttendance).sort((a, b) => b[0].localeCompare(a[0])).map(([date, status]) => (
                                        <div key={date} className="flex justify-between items-center p-2 border-b border-border-color last:border-0">
                                            <div className="text-sm font-medium">{date}</div>
                                            <div className={`text-xs px-2 py-1 rounded-full font-bold
                                                ${status === AttendanceStatus.Present ? 'bg-green-100 text-green-700' :
                                                    status === AttendanceStatus.Absent ? 'bg-red-100 text-red-700' :
                                                        status === AttendanceStatus.Late ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'}`}>
                                                {status}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'tutorship' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Notas de Seguimiento</label>
                                    <textarea
                                        className="w-full h-40 p-3 border border-border-color rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface resize-none"
                                        placeholder="Escribe observaciones, compromisos o notas sobre el alumno..."
                                        value={tutorshipNote}
                                        onChange={(e) => {
                                            setTutorshipNote(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveTutorship}>
                                        Guardar Notas
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end border-t border-border-color pt-4">
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            </div>
        </Modal>
    );
};

export default StudentProfileModal;
