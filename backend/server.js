const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const pool = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); 
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'https://irrigplus.vercel.app',
            'http://localhost:5173',
            'http://localhost:4173',
        ];
        let isAllowed = !origin || allowedOrigins.includes(origin);
        if (!isAllowed && process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            isAllowed = true;
        }
        if (!isAllowed && origin) {
            try {
                const hostname = new URL(origin).hostname;
                if (hostname.endsWith('.vercel.app') || hostname === 'localhost') {
                    isAllowed = true;
                }
            } catch (e) {}
        }
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 500, 
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use(limiter);


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10, 
    message: { error: 'Trop de tentatives de connexion, veuillez patienter 15 minutes.' }
});
app.use('/api/auth/login', loginLimiter);
app.use('/auth/login', loginLimiter);

// Routes
const authRoute = require('./routes/auth');
const usersRoute = require('./routes/users');
const dashboardRoute = require('./routes/dashboard');
const champsRoute = require('./routes/champs');
const pompesRoute = require('./routes/pompes');
const enrouleursRoute = require('./routes/enrouleurs');
const irrigationsRoute = require('./routes/irrigations');
const compensationsRoute = require('./routes/compensations');
const logsRoute = require('./routes/logs');

app.use('/api/auth', authRoute);
app.use('/auth', authRoute);

app.use('/api/users', usersRoute);
app.use('/users', usersRoute);

app.use('/api/dashboard', dashboardRoute);
app.use('/dashboard', dashboardRoute);

app.use('/api/champs', champsRoute);
app.use('/champs', champsRoute);

app.use('/api/pompes', pompesRoute);
app.use('/pompes', pompesRoute);

app.use('/api/enrouleurs', enrouleursRoute);
app.use('/enrouleurs', enrouleursRoute);

app.use('/api/irrigations', irrigationsRoute);
app.use('/irrigations', irrigationsRoute);

app.use('/api/compensations', compensationsRoute);
app.use('/compensations', compensationsRoute);

app.use('/api/logs', logsRoute);
app.use('/logs', logsRoute);

app.get('/', (req, res) => {
    res.json({ status: 'iRRIG+ API is running' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`iRRIG+ server running on port ${PORT}`);

    
    setInterval(() => {
        const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        require('http').get(`${url}/`, res => {
            console.log(`[Keep-Alive] Pinged self. Status: ${res.statusCode}`);
        }).on('error', err => {
            console.error(`[Keep-Alive] Ping failed:`, err.message);
        });
    }, 10 * 60 * 1000); 
});
