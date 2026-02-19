
export interface EvaluationType {
    id: string;
    name: string;
    weight: number; // Percentage (e.g., 30 for 30%)
    isAttendance?: boolean; // If true, grade is calculated automatically from attendance
}

export interface Evaluation {
    id: string;
    name: string;
    maxScore: number;
    partial: 1 | 2;
    typeId: string; // Links to EvaluationType id
    isTeamBased?: boolean; // If true, grades are shared across team members
    teamType?: 'base' | 'coyote'; // NUEVO: Define qué tipo de equipo usa la tarea
    classroomCourseWorkId?: string; // ID de la tarea en Google Classroom
}
