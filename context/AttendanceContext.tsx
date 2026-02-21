import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AttendanceStatus } from '../types';

export interface AttendanceState {
    attendance: {
        [groupId: string]: {
            [studentId: string]: {
                [date: string]: AttendanceStatus;
            };
        };
    };
}

export type AttendanceAction =
    | { type: 'SET_INITIAL_STATE'; payload: Partial<AttendanceState> }
    | { type: 'UPDATE_ATTENDANCE'; payload: { groupId: string; studentId: string; date: string; status: AttendanceStatus } }
    | { type: 'QUICK_ATTENDANCE'; payload: { groupId: string; date: string } }
    | { type: 'BULK_UPDATE_ATTENDANCE'; payload: { groupId: string; startDate: string; endDate: string; status: AttendanceStatus; overwrite: boolean } }
    | { type: 'BULK_SET_ATTENDANCE'; payload: { groupId: string; records: { studentId: string; date: string; status: AttendanceStatus }[] } };

export interface AttendanceContextProps {
    attendanceState: AttendanceState;
    attendanceDispatch: React.Dispatch<AttendanceAction>;
}

const initialState: AttendanceState = {
    attendance: {},
};

function attendanceReducer(state: AttendanceState, action: AttendanceAction): AttendanceState {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return { ...state, ...action.payload };

        case 'UPDATE_ATTENDANCE': {
            const { groupId, studentId, date, status } = action.payload;
            const groupAttendance = state.attendance[groupId] || {};
            const studentAttendance = groupAttendance[studentId] || {};

            return {
                ...state,
                attendance: {
                    ...state.attendance,
                    [groupId]: {
                        ...groupAttendance,
                        [studentId]: {
                            ...studentAttendance,
                            [date]: status
                        }
                    }
                }
            };
        }
        case 'BULK_UPDATE_ATTENDANCE': {
            // NOTE: the calculation of datesToUpdate needs `group.classDays`
            // and `getClassDates`. This requires access to the group object.
            // When moving to isolated contexts, we might either need to pass 
            // the calculated dates in the payload, or pass the group object 
            // instead of just the groupId. The original logic does `state.groups.find()`.
            return state;
        }

        case 'BULK_SET_ATTENDANCE': {
            const { groupId, records } = action.payload;
            const updatedAttendance = { ...state.attendance };
            const updatedGroupAttendance = { ...(updatedAttendance[groupId] || {}) };

            records.forEach(record => {
                const updatedStudentAttendance = { ...(updatedGroupAttendance[record.studentId] || {}) };
                updatedStudentAttendance[record.date] = record.status;
                updatedGroupAttendance[record.studentId] = updatedStudentAttendance;
            });

            updatedAttendance[groupId] = updatedGroupAttendance;
            return { ...state, attendance: updatedAttendance };
        }

        default:
            return state;
    }
}

export const AttendanceContext = createContext<AttendanceContextProps>({
    attendanceState: initialState,
    attendanceDispatch: () => null,
});

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [attendanceState, attendanceDispatch] = useReducer(attendanceReducer, initialState);

    return (
        <AttendanceContext.Provider value={{ attendanceState, attendanceDispatch }}>
            {children}
        </AttendanceContext.Provider>
    );
};

export const useAttendance = () => useContext(AttendanceContext);
