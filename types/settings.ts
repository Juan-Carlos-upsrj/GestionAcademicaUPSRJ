export type SidebarGroupDisplayMode = 'name' | 'name-abbrev' | 'abbrev';

export interface Settings {
    semesterStart: string;
    firstPartialEnd: string; // Keep for legacy logic support if needed, functional pivot is p1EvalEnd
    semesterEnd: string;
    // Nuevos campos para rangos de evaluación
    p1EvalStart: string;
    p1EvalEnd: string;
    p2EvalStart: string;
    p2EvalEnd: string;

    showMatricula: boolean;
    showTeamsInGrades: boolean;
    failByAttendance: boolean; // NUEVO: Determina si las faltas reprueban automáticamente
    sidebarGroupDisplayMode: SidebarGroupDisplayMode; // Replaces boolean
    theme: 'classic' | 'dark';
    lowAttendanceThreshold: number;
    googleCalendarUrl: string;
    googleCalendarColor: string;
    professorName: string;
    apiUrl: string;
    apiKey: string;
    mobileUpdateUrl: string; // URL for version.json
    enableReminders: boolean;
    reminderTime: number;
}

export interface Professor {
    name: string;
    birthdate: string; // MM-DD
}
