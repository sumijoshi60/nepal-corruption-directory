import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import casesRouter from './routes/cases.js';
import personsRouter from './routes/persons.js';
import sourcesRouter from './routes/sources.js';
import casePersonsRouter from './routes/case-persons.js';
import publicRouter from './routes/public.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/cases', casesRouter);
app.use('/api/persons', personsRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/case-persons', casePersonsRouter);
app.use('/api/public', publicRouter);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Nepal Corruption Cases Directory API',
        version: '1.0.0',
        endpoints: {
            cases: '/api/cases',
            persons: '/api/persons',
            sources: '/api/sources',
            casePersons: '/api/case-persons',
            public: '/api/public'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export default app;
