import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../config/authConfig';

function getClient(tokens: any) {
    const client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET
    );
    client.setCredentials(tokens);
    return client;
}

export async function listCourses(tokens: any) {
    if (!tokens) throw new Error('No tokens provided');
    const auth = getClient(tokens);
    const classroom = google.classroom({ version: 'v1', auth });

    try {
        const res = await classroom.courses.list({
            courseStates: ['ACTIVE'],
            teacherId: 'me'
        });
        return res.data.courses || [];
    } catch (error) {
        console.error('Error listing courses:', error);
        throw error;
    }
}

export async function listCourseWork(tokens: any, courseId: string) {
    if (!tokens) throw new Error('No tokens provided');
    const auth = getClient(tokens);
    const classroom = google.classroom({ version: 'v1', auth });

    try {
        const res = await classroom.courses.courseWork.list({
            courseId,
            courseWorkStates: ['PUBLISHED']
        });
        return res.data.courseWork || [];
    } catch (error) {
        console.error(`Error listing coursework for course ${courseId}:`, error);
        throw error;
    }
}

export async function listSubmissions(tokens: any, courseId: string, courseWorkId: string) {
    if (!tokens) throw new Error('No tokens provided');
    const auth = getClient(tokens);
    const classroom = google.classroom({ version: 'v1', auth });

    try {
        const res = await classroom.courses.courseWork.studentSubmissions.list({
            courseId,
            courseWorkId,
        });
        return res.data.studentSubmissions || [];
    } catch (error) {
        console.error(`Error listing submissions for course ${courseId}, work ${courseWorkId}:`, error);
        throw error;
    }
}

export async function listCourseStudents(tokens: any, courseId: string) {
    if (!tokens) throw new Error('No tokens provided');
    const auth = getClient(tokens);
    const classroom = google.classroom({ version: 'v1', auth });

    try {
        const res = await classroom.courses.students.list({
            courseId,
        });
        return res.data.students || [];
    } catch (error) {
        console.error(`Error listing students for course ${courseId}:`, error);
        throw error;
    }
}
