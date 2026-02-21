import { Group, TeacherClass } from './group';
import { AttendanceStatus } from './attendance';
import { Evaluation } from './evaluation';
import { CalendarEvent } from './calendar';
import { Settings } from './settings';
import { Toast, User } from './shared';
// import { Student, TutorshipEntry } from './student'; // Not directly used in AppState interface but used in AppAction

import { Student, TutorshipEntry } from './student';

export type ActiveView = 'dashboard' | 'groups' | 'teams' | 'attendance' | 'grades' | 'reports' | 'calendar' | 'tutorship';

export interface Archive {
    id: string;
    name: string;
    dateArchived: string;
    data: AppState;
}

export interface AppState {
    groups: Group[];
    attendance: {
        [groupId: string]: {
            [studentId: string]: {
                [date: string]: AttendanceStatus;
            };
        };
    };
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
    calendarEvents: CalendarEvent[];
    gcalEvents: CalendarEvent[];
    activeView: ActiveView;
    selectedGroupId: string | null;
    toasts: Toast[];
    archives: Archive[];
    teamNotes?: { [teamName: string]: string };
    coyoteTeamNotes?: { [teamName: string]: string }; // NUEVO
    teacherSchedule?: TeacherClass[];
    tutorshipData: { [studentId: string]: TutorshipEntry }; // NUEVO
    groupTutors: { [groupId: string]: string }; // NUEVO: Almacena quién es el tutor de cada grupo
    currentUser: User | null; // NUEVO
}

export interface GroupReportSummary {
    monthlyAttendance: { [monthYear: string]: number };
    evaluationAverages: { [evaluationId: string]: number };
}

export type AppAction =
    | { type: 'SET_INITIAL_STATE'; payload: Partial<AppState> }
    | { type: 'SET_VIEW'; payload: ActiveView }
    | { type: 'SET_SELECTED_GROUP'; payload: string | null }
    | { type: 'SAVE_GROUP'; payload: Group }
    | { type: 'DELETE_GROUP'; payload: string }
    | { type: 'SAVE_STUDENT'; payload: { groupId: string; student: Student } }
    | { type: 'BULK_ADD_STUDENTS'; payload: { groupId: string; students: Student[] } }
    | { type: 'DELETE_STUDENT'; payload: { groupId: string; studentId: string } }
    | { type: 'UPDATE_ATTENDANCE'; payload: { groupId: string; studentId: string; date: string; status: AttendanceStatus } }
    | { type: 'QUICK_ATTENDANCE'; payload: { groupId: string; date: string } }
    | { type: 'BULK_UPDATE_ATTENDANCE'; payload: { groupId: string; startDate: string; endDate: string; status: AttendanceStatus; overwrite: boolean } }
    | { type: 'BULK_SET_ATTENDANCE'; payload: { groupId: string; records: { studentId: string; date: string; status: AttendanceStatus }[] } }
    | { type: 'SAVE_EVALUATION'; payload: { groupId: string; evaluation: Evaluation } }
    | { type: 'DELETE_EVALUATION'; payload: { groupId: string; evaluationId: string } }
    | { type: 'REORDER_EVALUATION'; payload: { groupId: string; evaluationId: string; direction: 'left' | 'right' } }
    | { type: 'UPDATE_GRADE'; payload: { groupId: string; studentId: string; evaluationId: string; score: number | null } }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
    | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
    | { type: 'REMOVE_TOAST'; payload: number }
    | { type: 'SAVE_EVENT'; payload: CalendarEvent }
    | { type: 'DELETE_EVENT'; payload: string }
    | { type: 'SET_GCAL_EVENTS'; payload: CalendarEvent[] }
    | { type: 'ARCHIVE_CURRENT_STATE'; payload: string }
    | { type: 'RESTORE_ARCHIVE'; payload: string }
    | { type: 'DELETE_ARCHIVE'; payload: string }
    | { type: 'TRANSITION_SEMESTER'; payload: { newGroups: Group[] } }
    | { type: 'RENAME_TEAM'; payload: { oldName: string, newName: string, isCoyote: boolean } }
    | { type: 'DELETE_TEAM'; payload: { teamName: string, isCoyote: boolean } }
    | { type: 'UPDATE_TEAM_NOTE'; payload: { teamName: string, note: string, isCoyote: boolean } }
    | { type: 'ASSIGN_STUDENT_TEAM'; payload: { studentId: string, teamName: string | undefined, isCoyote: boolean } }
    | { type: 'CONVERT_TEAM_TYPE'; payload: { teamName: string, fromCoyote: boolean, groupId: string } } // NUEVO
    | { type: 'GENERATE_RANDOM_TEAMS'; payload: { groupId: string, maxTeamSize: number } } // NUEVO
    | { type: 'SET_TEACHER_SCHEDULE'; payload: TeacherClass[] }
    | { type: 'UPDATE_TUTORSHIP'; payload: { studentId: string; entry: TutorshipEntry } } // NUEVO
    | { type: 'SET_TUTORSHIP_DATA_BULK'; payload: { [studentId: string]: TutorshipEntry } } // NUEVO
    | { type: 'SET_GROUP_TUTORS_BULK'; payload: { [groupId: string]: string } } // NUEVO
    | { type: 'SET_GROUP_TUTOR'; payload: { groupId: string; tutorName: string } } // NUEVO
    | { type: 'SET_USER'; payload: User | null }; // NUEVO
