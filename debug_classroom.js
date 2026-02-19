
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = '816047293325-c6e9j4bubji15p160e6cjsq9bcv5v9ic.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

const tokens = {
    "access_token": "ya29.a0ATkoCc4PGegno1cQaEKa8RImNbvuw93dkpBL5xhBfsGROuD2aPvJOo5d_cZhQ7koxdCWJOgrdy2gY8ZM3zX06FRIUkhGqcCeENigJp-0D_uxSVB8dhSYcqgRKCDIubfd5x059nxRJ3taEJ4RZ9SDnlPwqXPD-TKWrky3tDOYH92Xq8IzlmD3LruGgyIorNnBUJnVGSPGaCgYKAf8SARMSFQHGX2MisInDEEuLnJTnMShybDZZYg0207",
    "scope": "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.profile.emails",
    "token_type": "Bearer",
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImM4MTZkMzM3YjgzNjVhMDZhODUxYWQ4MDAxNmMxNzEwOTk0OTI2MDkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI4MTYwNDcyOTMzMjUtYzZlOWo0YnViamkxNXAxNjBlNmNqc3E5YmN2NXY5aWMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI4MTYwNDcyOTMzMjUtYzZlOWo0YnViamkxNXAxNjBlNmNqc3E5YmN2NXY5aWMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTM2MDczMjc2MjAyMTEyMDExMzkiLCJoZCI6InVwc3JqLmVkdS5teCIsImVtYWlsIjoianNhbGdhZG9AdXBzcmouZWR1Lm14IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJrTExXZjlYakcwLTI0VHBPQ0VwekVRIiwibmFtZSI6Ikp1YW4gQ2FybG9zIFNhbGdhZG8gUm9ibGVzIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0poV1VXblBJTjRsc3hkNk50S00wb3RiMzVmbXN6ZjQyOURkQ3NmUE8xWWN4a25xRFk9czk2LWMiLCJnaXZlbl9uYW1lIjoiSnVhbiBDYXJsb3MiLCJmYW1pbHlfbmFtZSI6IlNhbGdhZG8gUm9ibGVzIiwiaWF0IjoxNzcxMzU5MTk0LCJleHAiOjE3NzEzNjI3OTR9.Yz3Aa4eZWm_im2piaLJQbxfhR8UdIShoCe1hZ4nQU7ByTmV8heRjZ0tsaC6cxSSqIhgLp9_HQEZzP3TFXHbnbV7gfcDrk4yvVMK-lDhGs5-69My8D_-OmuEKObLNJ_2PwVNbKcGlFDTqG115uZKFijlpTrUFpA2Pvu2QNs5c_aPZ1dIAOYJMV1Q8W_lWfianW69a91kORQ58AnTSShf7S7tKPKScF3jTSGABMBYGgMEUI8UqE8PoE8Gx7RRf8Rgmpfw2BmCvEPlZcTHRcMdGDNXD_YfX3yy5MmeaD6o7oTyGL4Ilm8oBBp8lD-t7fuQ7o_JFjBw4etAFqKWMXI_irQ",
    "refresh_token_expires_in": 533267,
    "expiry_date": 1771362794290,
    "refresh_token": "1//0fu67lSpzvcLeCgYIARAAGA8SNwF-L9IrYuiuwMjOXVxTyknsr4mSKKQ7ZTzsBKxRLH2fO9zEoRb47c3-rs8z5ds1inhIMy79Xog"
};

async function testClassroom() {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    client.setCredentials(tokens);

    // Force refresh first to be sure
    try {
        console.log("Refreshing token...");
        const res = await client.refreshAccessToken();
        console.log("Refresh successful.");
        // console.log(res.credentials);
    } catch (e) {
        console.error("Refresh failed:", e.message);
    }

    const classroom = google.classroom({ version: 'v1', auth: client });

    try {
        console.log("Listing courses...");
        const res = await classroom.courses.list({
            courseStates: ['ACTIVE'],
            teacherId: 'me'
        });
        console.log(`Courses found: ${res.data.courses ? res.data.courses.length : 0}`);
        if (res.data.courses) {
            res.data.courses.forEach(c => console.log(`- ${c.name} (${c.id})`));
        }
    } catch (e) {
        console.error("Error listing courses:", e.message);
        if (e.response) {
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

testClassroom();
