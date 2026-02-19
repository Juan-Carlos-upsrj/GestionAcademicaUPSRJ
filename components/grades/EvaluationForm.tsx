import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Evaluation, Group } from '../../types';
import Button from '../common/Button';
import Icon from '../icons/Icon';

interface EvaluationFormProps {
    evaluation?: Evaluation;
    group: Group;
    onSave: (evaluation: Evaluation) => void;
    onCancel: () => void;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ evaluation, group, onSave, onCancel }) => {
    const [name, setName] = useState(evaluation?.name || '');
    const [maxScore, setMaxScore] = useState(evaluation?.maxScore || 10);
    const [partial, setPartial] = useState<1 | 2>(evaluation?.partial || 1);
    const [isTeamBased, setIsTeamBased] = useState(evaluation?.isTeamBased || false);

    const hasBaseTeams = useMemo(() => group.students.some(s => s.team), [group]);
    const hasCoyoteTeams = useMemo(() => group.students.some(s => s.teamCoyote), [group]);

    const initialTeamType = evaluation?.teamType || (hasCoyoteTeams && !hasBaseTeams ? 'coyote' : 'base');
    const [teamType, setTeamType] = useState<'base' | 'coyote'>(initialTeamType);

    const availableTypes = (partial === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2).filter(t => !t.isAttendance);
    const [typeId, setTypeId] = useState(evaluation?.typeId || availableTypes[0]?.id || '');

    useEffect(() => {
        const newAvailableTypes = (partial === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2).filter(t => !t.isAttendance);
        if (!newAvailableTypes.some(t => t.id === typeId)) {
            setTypeId(newAvailableTypes[0]?.id || '');
        }
    }, [partial, typeId, group.evaluationTypes]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || maxScore <= 0 || !typeId) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        onSave({
            id: evaluation?.id || uuidv4(),
            name,
            maxScore,
            partial,
            typeId,
            isTeamBased,
            teamType: isTeamBased ? teamType : undefined
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="evalName" className="block text-sm font-medium">Nombre de la Evaluación</label>
                    <input type="text" id="evalName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full p-2 border border-border-color rounded-md bg-surface" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="maxScore" className="block text-sm font-medium">Puntuación Máxima</label>
                        <input type="number" id="maxScore" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} min="1" required className="mt-1 block w-full p-2 border border-border-color rounded-md bg-surface" />
                    </div>
                    <div>
                        <label htmlFor="partial" className="block text-sm font-medium">Parcial</label>
                        <select id="partial" value={partial} onChange={e => setPartial(Number(e.target.value) as 1 | 2)} className="mt-1 block w-full p-2 border border-border-color rounded-md bg-surface">
                            <option value={1}>Primer Parcial</option>
                            <option value={2}>Segundo Parcial</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="typeId" className="block text-sm font-medium">Tipo de Evaluación</label>
                    <select id="typeId" value={typeId} onChange={e => setTypeId(e.target.value)} className="mt-1 block w-full p-2 border border-border-color rounded-md bg-surface">
                        {availableTypes.map(type => <option key={type.id} value={type.id}>{type.name} ({type.weight}%)</option>)}
                    </select>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="isTeamBased" checked={isTeamBased} onChange={e => setIsTeamBased(e.target.checked)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                        <label htmlFor="isTeamBased" className="text-sm font-bold text-indigo-700 dark:text-indigo-400 cursor-pointer">
                            ¿Evaluación por EQUIPOS?
                        </label>
                    </div>

                    {isTeamBased && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block text-[10px] font-black uppercase text-indigo-600 mb-2">Usar integrantes de:</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTeamType('base')}
                                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 text-xs font-bold transition-all ${teamType === 'base' ? 'bg-white border-indigo-600 text-indigo-700 shadow-sm' : 'bg-transparent border-transparent text-slate-400 opacity-60'}`}
                                >
                                    <Icon name="users" className="w-4 h-4" /> Equipos Base {!hasBaseTeams && '(Vacío)'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTeamType('coyote')}
                                    className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 text-xs font-bold transition-all ${teamType === 'coyote' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'bg-transparent border-transparent text-slate-400 opacity-60'}`}
                                >
                                    <Icon name="dog" className="w-4 h-4" /> Equipos Coyote {!hasCoyoteTeams && '(Vacío)'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Guardar Evaluación</Button>
            </div>
        </form>
    );
};

export default EvaluationForm;
