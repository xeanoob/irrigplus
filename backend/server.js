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


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/parcelles', (req,res) => res.status(404).send('Deprecated'));
app.use('/api/materiel', (req,res) => res.status(404).send('Deprecated'));
app.use('/api/champs', require('./routes/champs'));
app.use('/api/pompes', require('./routes/pompes'));
app.use('/api/enrouleurs', require('./routes/enrouleurs'));
app.use('/api/irrigations', require('./routes/irrigations'));
app.use('/api/compensations', require('./routes/compensations'));

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
