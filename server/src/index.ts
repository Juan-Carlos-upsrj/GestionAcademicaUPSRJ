import dotenv from 'dotenv';
import app from './app';

dotenv.config();

// FATAL CHECK FOR JWT_SECRET
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'secret') {
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing or insecurely set to 'secret'.\nThe application refuses to start to protect user data.");
    process.exit(1);
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
