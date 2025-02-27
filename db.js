const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'president',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'elections',
    password: process.env.DB_PASSWORD || 'electoral',
    port: process.env.DB_PORT || 5432,
});

async function initializeDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                description TEXT DEFAULT '',
                is_candidate BOOLEAN DEFAULT FALSE,
                has_voted BOOLEAN DEFAULT FALSE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                voter_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
            );
        `);
    } catch (error) {
        console.error(error);
    }
}

initializeDB();

module.exports = pool;