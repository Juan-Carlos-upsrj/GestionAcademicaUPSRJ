import { useState, useMemo, useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { Evaluation } from '../types';
import {
    calculatePartialAverage,
    calculateFinalGradeWithRecovery,
    calculateAttendancePercentage
} from '../services/gradeCalculation';

export const GRADE_REMEDIAL_P1 = 'GRADE_REMEDIAL_P1';
export const GRADE_REMEDIAL_P2 = 'GRADE_REMEDIAL_P2';
export const GRADE_EXTRA = 'GRADE_EXTRA';
export const GRADE_SPECIAL = 'GRADE_SPECIAL';

export const useGradesManager = () => {
    const { state, dispatch } = useContext(AppContext);
    const { settings, updateSettings } = useSettings();
    const { groups, evaluations, grades, selectedGroupId, attendance } = state;

    const [viewMode, setViewMode] = useState<'ordinary' | 'recovery'>('ordinary');
    const [searchTerm, setSearchTerm] = useState('');
    const [displayTeamType, setDisplayTeamType] = useState<'base' | 'coyote'>('base');

    const setSelectedGroupId = useCallback((id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
    }, [dispatch]);

    // Select default group if none selected
    useEffect(() => {
        if (!selectedGroupId && groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId, setSelectedGroupId]);

    const group = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);

    const groupEvaluations = useMemo(() => (evaluations[selectedGroupId || ''] || []), [evaluations, selectedGroupId]);
    const groupGrades = useMemo(() => grades[selectedGroupId || ''] || {}, [grades, selectedGroupId]);

    const p1Evaluations = useMemo(() => groupEvaluations.filter(e => e.partial === 1), [groupEvaluations]);
    const p2Evaluations = useMemo(() => groupEvaluations.filter(e => e.partial === 2), [groupEvaluations]);

    const p1AttendanceType = useMemo(() => group?.evaluationTypes.partial1.find(t => t.isAttendance), [group]);
    const p2AttendanceType = useMemo(() => group?.evaluationTypes.partial2.find(t => t.isAttendance), [group]);

    const hasBothTeamTypes = useMemo(() => {
        if (!group) return false;
        return group.students.some(s => s.team) && group.students.some(s => s.teamCoyote);
    }, [group]);

    const filteredStudents = useMemo(() => {
        if (!group) return [];
        const term = searchTerm.toLowerCase();
        return group.students.filter(s =>
            s.name.toLowerCase().includes(term) ||
            (s.matricula && s.matricula.toLowerCase().includes(term)) ||
            (s.nickname && s.nickname.toLowerCase().includes(term))
        );
    }, [group, searchTerm]);

    const studentsForRecovery = useMemo(() => {
        return filteredStudents.filter(student => {
            const att = attendance[group!.id]?.[student.id] || {};
            const globalAtt = calculateAttendancePercentage(group!, 'global', settings, att);
            const p1Avg = calculatePartialAverage(group!, 1, groupEvaluations, groupGrades[student.id] || {}, settings, att);
            const p2Avg = calculatePartialAverage(group!, 2, groupEvaluations, groupGrades[student.id] || {}, settings, att);
            const r1 = groupGrades[student.id]?.[GRADE_REMEDIAL_P1] ?? null;
            const r2 = groupGrades[student.id]?.[GRADE_REMEDIAL_P2] ?? null;
            const extra = groupGrades[student.id]?.[GRADE_EXTRA] ?? null;
            const special = groupGrades[student.id]?.[GRADE_SPECIAL] ?? null;

            const { isFailing, attendanceStatus } = calculateFinalGradeWithRecovery(
                p1Avg, p2Avg, r1, r2, extra, special, globalAtt,
                settings.lowAttendanceThreshold, settings.failByAttendance
            );

            return isFailing || attendanceStatus !== 'ok' || (p1Avg !== null && p1Avg < 7) || (p2Avg !== null && p2Avg < 7);
        });
    }, [group, filteredStudents, groupEvaluations, groupGrades, settings, attendance]);

    const handleGradeChange = (studentId: string, evaluationId: string, score: string) => {
        if (selectedGroupId) {
            const val = parseFloat(score);
            const scoreValue = score === '' ? null : Math.max(0, isNaN(val) ? 0 : val);
            dispatch({ type: 'UPDATE_GRADE', payload: { groupId: selectedGroupId, studentId, evaluationId, score: scoreValue } });
        }
    };

    const handleReorder = (evaluationId: string, direction: 'left' | 'right') => {
        if (selectedGroupId) {
            dispatch({ type: 'REORDER_EVALUATION', payload: { groupId: selectedGroupId, evaluationId, direction } });
        }
    };

    const deleteEvaluation = (evaluationId: string) => {
        if (selectedGroupId) {
            dispatch({ type: 'DELETE_EVALUATION', payload: { groupId: selectedGroupId, evaluationId } });
        }
    };

    const saveEvaluation = (evaluation: Evaluation) => {
        if (selectedGroupId) {
            dispatch({ type: 'SAVE_EVALUATION', payload: { groupId: selectedGroupId, evaluation } });
        }
    };

    return {
        // State
        selectedGroupId,
        groups,
        group,
        viewMode,
        searchTerm,
        displayTeamType,
        settings,

        // Computed Data
        groupEvaluations,
        groupGrades,
        attendance,
        p1Evaluations,
        p2Evaluations,
        p1AttendanceType,
        p2AttendanceType,
        hasBothTeamTypes,
        filteredStudents,
        studentsForRecovery,

        // Setters
        setSelectedGroupId,
        setViewMode,
        setSearchTerm,
        setDisplayTeamType,

        // Actions
        handleGradeChange,
        handleReorder,
        deleteEvaluation,
        saveEvaluation,
        updateSettings,
        dispatch // Expose dispatch purely for edge cases (like toasts)
    };
};
