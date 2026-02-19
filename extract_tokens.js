
const fs = require('fs');
const path = 'C:\\Users\\Yeici\\AppData\\Roaming\\gestion-academica-iaev\\appData.json';
try {
    if (fs.existsSync(path)) {
        const data = JSON.parse(fs.readFileSync(path, 'utf8'));
        if (data.currentUser && data.currentUser.tokens) {
            console.log(JSON.stringify(data.currentUser.tokens, null, 2));
        } else {
            console.log("No tokens found in currentUser");
        }
    } else {
        console.log("File not found");
    }
} catch (e) {
    console.error(e);
}
