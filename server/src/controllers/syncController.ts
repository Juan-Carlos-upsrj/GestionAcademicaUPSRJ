import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: { userId: string; role: string };
}

export const pullState = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user?.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Fetch all data for the user
        const groups = await prisma.group.findMany({
            where: { teacherId: userId },
            include: {
                students: {
                    include: {
                        grades: true,
                        attendance: true
                    }
                },
                evaluations: true,
                evaluationTypes: true
            }
        });

        // Transform to AppState shape
        const appState: any = {
            groups: [],
            attendance: {},
            grades: {},
            evaluations: {},
            // Default empty for others
            calendarEvents: [],
            gcalEvents: [],
            settings: {
                lowAttendanceThreshold: 80,
                failByAttendance: true,
                showTeamsInGrades: true,
                sidebarGroupDisplayMode: 'full'
            },
            activeView: 'dashboard',
            selectedGroupId: null,
            toasts: [],
            archives: [],
            currentUser: null
        };

        for (const group of groups) {
            // Groups
            appState.groups.push({
                id: group.id,
                name: group.name,
                subject: group.subject,
                subjectShortName: group.subjectShortName || undefined,
                quarter: group.quarter || undefined,
                classDays: group.classDays,
                students: group.students.map(s => ({
                    id: s.id,
                    name: s.name,
                    matricula: s.matricula || '',
                    nickname: s.nickname || undefined,
                    isRepeating: s.isRepeating,
                    team: s.team || undefined,
                    teamCoyote: s.teamCoyote || undefined
                })),
                color: group.color,
                evaluationTypes: { partial1: [], partial2: [] }, // TODO: Map evaluation types properly if needed
                classroomCourseId: group.classroomCourseId || undefined
            });

            // Evaluations
            appState.evaluations[group.id] = group.evaluations.map(e => ({
                id: e.id,
                name: e.name,
                maxScore: e.maxScore,
                partial: e.partial,
                typeId: e.typeId,
                isTeamBased: e.isTeamBased,
                teamType: e.teamType as any || undefined,
                classroomCourseWorkId: e.classroomCourseWorkId || undefined
            }));

            // Grades
            appState.grades[group.id] = {};
            // Attendance
            appState.attendance[group.id] = {};

            for (const student of group.students) {
                // Grades
                appState.grades[group.id][student.id] = {};
                for (const grade of student.grades) {
                    appState.grades[group.id][student.id][grade.evaluationId] = grade.score;
                }

                // Attendance
                appState.attendance[group.id][student.id] = {};
                for (const att of student.attendance) {
                    appState.attendance[group.id][student.id][att.date.toISOString().split('T')[0]] = att.status;
                }
            }
        }

        res.json(appState);

    } catch (error) {
        console.error('Pull Error:', error);
        res.status(500).json({ message: 'Failed to pull data' });
    }
};

export const pushState = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user?.userId;
    const state = req.body; // Expects AppState-like structure

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // NOTE: This is a simplified "Full Sync" approach.
        // In a real production app, we would process deltas or be more careful about overwriting.
        // For now, we will upsert Groups and deeply nested data.

        // 1. Groups
        if (state.groups) {
            for (const group of state.groups) {
                // Upsert Group
                await prisma.group.upsert({
                    where: { id: group.id },
                    update: {
                        name: group.name,
                        subject: group.subject,
                        subjectShortName: group.subjectShortName,
                        quarter: group.quarter,
                        classDays: group.classDays,
                        color: group.color,
                        classroomCourseId: group.classroomCourseId
                    },
                    create: {
                        id: group.id,
                        name: group.name,
                        teacherId: userId,
                        subject: group.subject,
                        subjectShortName: group.subjectShortName,
                        quarter: group.quarter,
                        classDays: group.classDays,
                        color: group.color,
                        classroomCourseId: group.classroomCourseId
                    }
                });

                // 2. Students
                if (group.students) {
                    for (const student of group.students) {
                        await prisma.student.upsert({
                            where: { id: student.id },
                            update: {
                                name: student.name,
                                matricula: student.matricula,
                                nickname: student.nickname,
                                isRepeating: student.isRepeating || false,
                                team: student.team,
                                teamCoyote: student.teamCoyote,
                                groupId: group.id // Ensure strictly linked
                            },
                            create: {
                                id: student.id,
                                name: student.name,
                                matricula: student.matricula,
                                nickname: student.nickname,
                                isRepeating: student.isRepeating || false,
                                team: student.team,
                                teamCoyote: student.teamCoyote,
                                groupId: group.id
                            }
                        });
                    }
                }

                // 3. Evaluations
                if (state.evaluations && state.evaluations[group.id]) {
                    for (const ev of state.evaluations[group.id]) {
                        // We need a proper typeId. For now, we might need to find or create a default type if missing.
                        // Assuming 'Assignments' type exists or we create dummy.
                        // Ideally, EvaluationType should also be synced.

                        // Hack: Create a default type if specific type logic isn't ready
                        const defaultType = await prisma.evaluationType.upsert({
                            where: { id: ev.typeId || 'default-type-' + group.id },
                            update: {},
                            create: {
                                id: ev.typeId || 'default-type-' + group.id,
                                name: 'General',
                                weight: 100,
                                groupId: group.id,
                                partial: ev.partial
                            }
                        });

                        await prisma.evaluation.upsert({
                            where: { id: ev.id },
                            update: {
                                name: ev.name,
                                maxScore: ev.maxScore,
                                partial: ev.partial,
                                isTeamBased: ev.isTeamBased,
                                teamType: ev.teamType,
                                classroomCourseWorkId: ev.classroomCourseWorkId,
                                typeId: defaultType.id // Ensure link
                            },
                            create: {
                                id: ev.id,
                                name: ev.name,
                                maxScore: ev.maxScore,
                                partial: ev.partial,
                                isTeamBased: ev.isTeamBased || false,
                                teamType: ev.teamType,
                                classroomCourseWorkId: ev.classroomCourseWorkId,
                                typeId: defaultType.id,
                                groupId: group.id
                            }
                        });
                    }
                }
            }
        }

        // 4. Grades
        // Iterate through all groups in grades object
        if (state.grades) {
            for (const [_groupId, students] of Object.entries(state.grades)) {
                for (const [studentId, evaluations] of Object.entries(students as any)) {
                    for (const [evalId, score] of Object.entries(evaluations as any)) {
                        if (score !== null) {
                            await prisma.grade.upsert({
                                where: {
                                    studentId_evaluationId: {
                                        studentId: studentId,
                                        evaluationId: evalId
                                    }
                                },
                                update: { score: Number(score) },
                                create: {
                                    studentId: studentId,
                                    evaluationId: evalId,
                                    score: Number(score)
                                }
                            });
                        }
                    }
                }
            }
        }

        // 5. Attendance
        if (state.attendance) {
            for (const [_groupId, students] of Object.entries(state.attendance)) {
                for (const [studentId, dates] of Object.entries(students as any)) {
                    for (const [dateStr, status] of Object.entries(dates as any)) {
                        const date = new Date(dateStr);
                        await prisma.attendance.upsert({
                            where: {
                                studentId_date: {
                                    studentId: studentId,
                                    date: date
                                }
                            },
                            update: { status: String(status) },
                            create: {
                                studentId: studentId,
                                date: date,
                                status: String(status)
                            }
                        });
                    }
                }
            }
        }

        res.json({ message: 'Sync successful' });
    } catch (error) {
        console.error('Push Error:', error);
        res.status(500).json({ message: 'Failed to push data' });
    }
};
