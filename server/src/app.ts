import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';

import syncRoutes from './routes/syncRoutes';

const app = express();

// Apply Security HTTP headers
app.use(helmet());

// Apply rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Demasiadas peticiones desde este IP, intente de nuevo en 15 minutos.'
});
app.use(limiter);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);

app.get('/', (_req, res) => {
    res.send('Gestion Academica API');
});

export default app;
