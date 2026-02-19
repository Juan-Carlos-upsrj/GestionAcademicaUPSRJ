const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = 'reporte_Carmina_Nayelli_H_H_20260218.json';
const OUTPUT_FILE = 'appData_restored.json';

// Default Structures
const defaultSettings = {
    minGrade: 0,
    maxGrade: 10,
    passingGrade: 7,
    sidebarGroupDisplayMode: 'name-abbrev',
    theme: 'cupcake',
    showTeamsInGrades: false
};

const defaultEvaluationTypes = {
    partial1: [{ id: 'default-p1', name: 'General', weight: 100 }],
    partial2: [{ id: 'default-p2', name: 'General', weight: 100 }]
};

function convert() {
    try {
        const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
        const report = JSON.parse(rawData);

        console.log(`Processing report for: ${report.professor}`);
        console.log(`Found ${report.groups.length} groups.`);

        const appState = {
            groups: [],
            attendance: {},
            evaluations: {},
            grades: {},
            calendarEvents: [],
            gcalEvents: [],
            settings: defaultSettings,
            activeView: 'dashboard',
            selectedGroupId: null,
            toasts: [],
            archives: [],
            teamNotes: {},
            coyoteTeamNotes: {},
            students: [], // Optional flat list if needed, but usually inside groups
            currentUser: {
                id: 'restored-user-' + Date.now(),
                googleId: 'restored-google-id', // Placeholder
                username: report.professor.split(' ')[0].toLowerCase(),
                email: 'restored@example.com', // Placeholder
                name: report.professor, // "Carmina Nayelli H.H"
                picture: '',
                careerId: 'iaev',
                tokens: null // No tokens available
            }
        };

        const groupsMap = new Map(); // groupId -> Group Object
        const attendanceMap = {}; // groupId -> { studentId -> { date -> status } }

        report.groups.forEach(groupData => {
            // 1. Get or Create Group
            let group = groupsMap.get(groupData.groupId);
            if (!group) {
                group = {
                    id: groupData.groupId,
                    name: groupData.groupName,
                    subject: groupData.subject,
                    classDays: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi'],
                    color: 'indigo',
                    students: [], // We will populate this from valid students map later
                    evaluationTypes: defaultEvaluationTypes,
                    quarter: '1º'
                };
                groupsMap.set(groupData.groupId, group);
                attendanceMap[group.id] = {};
                appState.evaluations[group.id] = [];
                appState.grades[group.id] = {}; // Initialize grades
            }

            // 2. Process Students
            // We use a temporary map for this group to ensure unique students
            // Since we might encounter the same group multiple times in the JSON,
            // we need to access the *existing* students of that group.
            // However, the 'students' array on the group object is what we will write to.
            // To make lookup easier, let's process students into a Map stored alongside the group or just iterate.
            // Better: Let's keep a Set of studentIds per group to avoid pushing duplicates into the array,
            // AND merge attendance.

            // Initialize student map for this group if checking for the first time in this loop logic isn't enough
            // actually, since we are iterating, let's look up existence.

            groupData.students.forEach(studentData => {
                // Check if student already exists in this group
                let existingStudent = group.students.find(s => s.id === studentData.studentId);

                if (!existingStudent) {
                    existingStudent = {
                        id: studentData.studentId,
                        name: studentData.name
                        // add other fields if necessary
                    };
                    group.students.push(existingStudent);

                    // Init attendance bucket for this student
                    if (!attendanceMap[group.id][studentData.studentId]) {
                        attendanceMap[group.id][studentData.studentId] = {};
                    }
                }

                // 3. Process/Merge Attendance
                if (!attendanceMap[group.id][studentData.studentId]) {
                    attendanceMap[group.id][studentData.studentId] = {};
                }

                studentData.records.forEach(record => {
                    attendanceMap[group.id][studentData.studentId][record.date] = record.status;
                });
            });
        });

        // Finalize
        appState.groups = Array.from(groupsMap.values());
        appState.attendance = attendanceMap;

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(appState, null, 2));
        console.log(`Successfully created ${OUTPUT_FILE}`);

    } catch (error) {
        console.error("Error converting file:", error);
    }
}

convert();
