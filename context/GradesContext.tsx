import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Evaluation } from '../types';

export interface GradesState {
    evaluations: {
        [groupId: string]: Evaluation[];
    };
    grades: {
        [groupId: string]: {
            [studentId: string]: {
                [evaluationId: string]: number | null;
            };
        };
    };
}

export type GradesAction =
    | { type: 'SET_INITIAL_STATE'; payload: Partial<GradesState> }
    | { type: 'SAVE_EVALUATION'; payload: { groupId: string; evaluation: Evaluation } }
    | { type: 'DELETE_EVALUATION'; payload: { groupId: string; evaluationId: string } }
    | { type: 'REORDER_EVALUATION'; payload: { groupId: string; evaluationId: string; direction: 'left' | 'right' } }
    | { type: 'UPDATE_GRADE'; payload: { groupId: string; studentId: string; evaluationId: string; score: number | null } };

export interface GradesContextProps {
    gradesState: GradesState;
    gradesDispatch: React.Dispatch<GradesAction>;
}

const initialState: GradesState = {
    evaluations: {},
    grades: {},
};

function gradesReducer(state: GradesState, action: GradesAction): GradesState {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return { ...state, ...action.payload };

        case 'SAVE_EVALUATION': {
            const evals = state.evaluations[action.payload.groupId] || [];
            const index = evals.findIndex((e) => e.id === action.payload.evaluation.id);
            if (index > -1) {
                return {
                    ...state,
                    evaluations: {
                        ...state.evaluations,
                        [action.payload.groupId]: [
                            ...evals.slice(0, index),
                            action.payload.evaluation,
                            ...evals.slice(index + 1),
                        ]
                    }
                };
            }
            return {
                ...state,
                evaluations: {
                    ...state.evaluations,
                    [action.payload.groupId]: [...evals, action.payload.evaluation]
                }
            };
        }

        case 'DELETE_EVALUATION': {
            const evals = state.evaluations[action.payload.groupId] || [];
            return {
                ...state,
                evaluations: {
                    ...state.evaluations,
                    [action.payload.groupId]: evals.filter((e) => e.id !== action.payload.evaluationId)
                }
            };
        }

        case 'REORDER_EVALUATION': {
            const groupEvals = [...(state.evaluations[action.payload.groupId] || [])];
            const currentIndex = groupEvals.findIndex(e => e.id === action.payload.evaluationId);
            if (currentIndex === -1) return state;

            const newIndex = action.payload.direction === 'left' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= groupEvals.length) return state;

            const item = groupEvals.splice(currentIndex, 1)[0];
            groupEvals.splice(newIndex, 0, item);

            return {
                ...state,
                evaluations: {
                    ...state.evaluations,
                    [action.payload.groupId]: groupEvals
                }
            };
        }

        case 'UPDATE_GRADE': {
            const { groupId, studentId, evaluationId, score } = action.payload;
            const groupGrades = state.grades[groupId] || {};
            const studentGrades = groupGrades[studentId] || {};

            return {
                ...state,
                grades: {
                    ...state.grades,
                    [groupId]: {
                        ...groupGrades,
                        [studentId]: {
                            ...studentGrades,
                            [evaluationId]: score
                        }
                    }
                }
            };
        }

        default:
            return state;
    }
}

export const GradesContext = createContext<GradesContextProps>({
    gradesState: initialState,
    gradesDispatch: () => null,
});

export const GradesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [gradesState, gradesDispatch] = useReducer(gradesReducer, initialState);

    // Initial load logic here if needed, 
    // but typically loaded globally or we will modify AppContext loading.

    return (
        <GradesContext.Provider value={{ gradesState, gradesDispatch }}>
            {children}
        </GradesContext.Provider>
    );
};

export const useGrades = () => useContext(GradesContext);
