export interface Student {
    id: string;
    name: string;
    matricula: string;
    nickname?: string;
    isRepeating?: boolean; // True if repeating the subject (Recursamiento)
    team?: string;        // Name or ID of the team they belong to (BASE)
    teamCoyote?: string;  // Name or ID of the Coyote team
}

export interface TutorshipEntry {
    strengths: string;
    opportunities: string;
    summary: string;
    author?: string; // Campo para identificar quién escribió la nota
}
