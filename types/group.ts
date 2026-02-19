import { Student } from './student';
import { DayOfWeek } from './shared';
import { EvaluationType } from './evaluation';

export interface Group {
    id: string;
    name: string;
    subject: string;
    subjectShortName?: string; // Short version of subject for UI elements (e.g., "MAT", "FÍS")
    quarter?: string; // New field for Cuatrimestre (e.g., "1º", "5º")
    classDays: DayOfWeek[];
    students: Student[];
    color: string; // e.g., 'indigo', 'green', etc.
    evaluationTypes: {
        partial1: EvaluationType[];
        partial2: EvaluationType[];
    };
    classroomCourseId?: string; // ID del curso de Google Classroom vinculado
}

export interface TeacherClass {
    id: string;
    day: DayOfWeek;
    startTime: number;
    duration: number;
    subjectName: string;
    groupName: string;
}
