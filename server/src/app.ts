import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';

import syncRoutes from './routes/syncRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);

app.get('/', (_req, res) => {
    res.send('Gestion Academica API');
});

export default app;
