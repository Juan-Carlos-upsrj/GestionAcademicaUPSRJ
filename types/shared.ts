
export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface User {
    username: string;
    name: string;
    careerId: string;
    department?: string;
    googleId?: string;
    email?: string;
    picture?: string;
    accessToken?: string;
    tokens?: any;
}

export interface MobileUpdateInfo {
    version: string;
    url: string;
    notes: string;
}

export interface MotivationalQuote {
    text: string;
    author: string;
    icon?: string;
    image?: string;
}
