require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/routes');
const vehicleRoutes = require('./routes/vehicles');
const adminRoutes = require('./routes/admin');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Configuration error: JWT_SECRET must be set and at least 32 characters long.');
  process.exit(1);
}

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5500,http://localhost:5500')
  .split(',').map(value => value.trim()).filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  }
}));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.json({ service: 'RouteForge API', health: '/api/health' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'RouteForge API' }));

app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({
  message: 'API endpoint not found.',
  method: req.method,
  path: req.originalUrl,
  hint: 'Check the request method, URL, and that Render deployed the latest backend commit.'
}));

app.use((err, _req, res, _next) => {
  console.error(err.message);
  if (err.code === 11000) return res.status(409).json({ message: 'A record with that unique value already exists.' });
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
  if (err.message === 'Origin is not allowed by CORS.') return res.status(403).json({ message: err.message });
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message });
});

const port = Number(process.env.PORT || 5000);
connectDB()
  .then(() => app.listen(port, () => console.log(`RouteForge API listening on port ${port}`)))
  .catch(error => {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  });
