const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.APP_PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Initialize database
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS citizens (
                id SERIAL PRIMARY KEY,
                nin VARCHAR(11) UNIQUE NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE,
                phone VARCHAR(15),
                date_of_birth DATE NOT NULL,
                state_of_origin VARCHAR(100),
                lga VARCHAR(100),
                address TEXT,
                occupation VARCHAR(100),
                gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
                marital_status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'officer',
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(`
            INSERT INTO users (username, password_hash, role, full_name, email) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO NOTHING
        `, ['admin', hashedPassword, 'admin', 'System Administrator', 'admin@nimc.gov.ng']);

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'NIMC Backend API',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.full_name,
                email: user.email
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Citizen management endpoints
app.get('/api/citizens', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM citizens 
            WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR nin ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        let countQuery = `
            SELECT COUNT(*) FROM citizens 
            WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR nin ILIKE $1
        `;

        const searchTerm = `%${search}%`;

        const [result, countResult] = await Promise.all([
            pool.query(query, [searchTerm, limit, offset]),
            pool.query(countQuery, [searchTerm])
        ]);

        res.json({
            citizens: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult.rows[0].count / limit),
                totalItems: parseInt(countResult.rows[0].count),
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching citizens:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/citizens', authenticateToken, async (req, res) => {
    const {
        nin,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        stateOfOrigin,
        lga,
        address,
        occupation,
        gender,
        maritalStatus
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO citizens 
             (nin, first_name, last_name, email, phone, date_of_birth, state_of_origin, lga, address, occupation, gender, marital_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [nin, firstName, lastName, email, phone, dateOfBirth, stateOfOrigin, lga, address, occupation, gender, maritalStatus]
        );

        res.status(201).json({
            success: true,
            message: 'Citizen registered successfully',
            citizen: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            res.status(400).json({ error: 'NIN already exists' });
        } else {
            console.error('Error creating citizen:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.get('/api/citizens/:nin', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM citizens WHERE nin = $1',
            [req.params.nin]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Citizen not found' });
        }

        res.json({ citizen: result.rows[0] });
    } catch (error) {
        console.error('Error fetching citizen:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Statistics endpoint
app.get('/api/statistics', authenticateToken, async (req, res) => {
    try {
        const [totalCitizens, todayRegistrations, stateStats, genderStats] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM citizens'),
            pool.query("SELECT COUNT(*) FROM citizens WHERE DATE(created_at) = CURRENT_DATE"),
            pool.query('SELECT state_of_origin, COUNT(*) FROM citizens GROUP BY state_of_origin'),
            pool.query('SELECT gender, COUNT(*) FROM citizens GROUP BY gender')
        ]);

        res.json({
            totalCitizens: parseInt(totalCitizens.rows[0].count),
            todayRegistrations: parseInt(todayRegistrations.rows[0].count),
            stateDistribution: stateStats.rows,
            genderDistribution: genderStats.rows
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize and start server
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`NIMC Backend running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`JWT Secret: ${process.env.JWT_SECRET ? 'Loaded' : 'Missing'}`);
    });
});