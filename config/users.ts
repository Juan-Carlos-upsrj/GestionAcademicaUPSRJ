


export interface User {
    username: string;
    password: string; // Plain text for mock demo
    name: string;
    careerId: string; // 'software' | 'therapy' | etc.
    department: string;
}

// Map careerIds to their specific configurations if we had multiple in careerConfig
// For now we will support switching the GLOBAL config based on this ID in the future,
// but for this step 1, we just need the users.

export const MOCK_USERS: User[] = [
    {
        username: 'admin',
        password: '123',
        name: 'Administrador General',
        careerId: 'isw',
        department: 'Ingeniería',
    },
    {
        username: 'docente_fisica',
        password: '123',
        name: 'Lic. Ana Martínez',
        careerId: 'ltf',
        department: 'Salud',
    },
    {
        username: 'docente_iaev',
        password: '123',
        name: 'Mtro. Carlos Ruiz',
        careerId: 'iaev',
        department: 'Animación',
    },
    {
        username: 'docente_imi',
        password: '123',
        name: 'Ing. Pedro Sánchez',
        careerId: 'imi',
        department: 'Industrial',
    },
    {
        username: 'docente_isa',
        password: '123',
        name: 'Ing. Laura Gómez',
        careerId: 'isa',
        department: 'Automotriz',
    },
    {
        username: 'docente_irc',
        password: '123',
        name: 'Dr. Roberto Díaz',
        careerId: 'irc',
        department: 'Robótica',
    },
    {
        username: 'docente_idiomas',
        password: '123',
        name: 'Lic. Sarah Smith',
        careerId: 'idiomas',
        department: 'Idiomas',
    },
    {
        username: 'docente_stem',
        password: '123',
        name: 'Dr. Alan Turing',
        careerId: 'stem',
        department: 'Ciencias Básicas',
    }
];
