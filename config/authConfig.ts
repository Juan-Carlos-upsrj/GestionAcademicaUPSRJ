export const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '816047293325-c6e9j4bubji15p160e6cjsq9bcv5v9ic.apps.googleusercontent.com';
export const GOOGLE_CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET || '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';
export const GOOGLE_REDIRECT_URI = 'gestion-docente://auth/callback';

// Whitelist of allowed emails (Check disabled in auth.ts)
export const ALLOWED_EMAILS = [
    // Add emails here if you want to restrict access in the future
    // 'professor@upsrj.edu.mx',
];

// Map emails to specific careers
export const EMAIL_TO_CAREER_MAP: Record<string, string> = {
    // 'professor@upsrj.edu.mx': 'iaev',
    // Defaulting to 'iaev' (Software Engineering) for all unmapped emails
};

export const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.profile.emails'
];
