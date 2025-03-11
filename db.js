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

async function setUserAsCandidate(userId) {
    try {
        const result = await pool.query(
            `UPDATE users SET is_candidate = TRUE WHERE id = $1 RETURNING *`, 
            [userId]
        );
        return result.rowCount > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Database error:", error);
        throw error;
    }
}

async function hasUserVoted(userId) {
    try {
        const result = await pool.query(
            'SELECT * FROM votes WHERE voter_id = $1', 
            [userId]
        );
        return result.rows.length > 0;
    } catch (error) {
        console.error("Database error in hasUserVoted:", error);
        throw error;
    }
}

async function castVote(voterId, candidateId) {
    try {
        const result = await pool.query(
            'INSERT INTO votes (voter_id, candidate_id) VALUES ($1, $2) RETURNING *',
            [voterId, candidateId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Database error in castVote:", error);
        throw error;
    }
}

async function getCandidates() {
    try {
        const result = await pool.query(`
            SELECT id, username, description 
            FROM users 
            WHERE is_candidate = TRUE
            ORDER BY username ASC
        `);
        return result.rows;
    } catch (error) {
        console.error("Database error in getCandidates:", error);
        throw error;
    }
}

async function getUserByUsername(username) {
    try {
        const result = await pool.query(
            'SELECT id, username, password FROM users WHERE username = $1', 
            [username]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Database error in getUserByUsername:", error);
        throw error;
    }
}

async function getCandidatesWithVotes() {
    try {
        const result = await pool.query(`
            SELECT users.id, users.username, COALESCE(COUNT(votes.id), 0) AS votes
            FROM users
            LEFT JOIN votes ON users.id = votes.candidate_id
            WHERE users.is_candidate = TRUE
            GROUP BY users.id, users.username
            ORDER BY votes DESC
        `);
        return result.rows;
    } catch (error) {
        console.error("Database error in getCandidatesWithVotes:", error);
        throw error;
    }
}

async function createUser(username, hashedPassword) {
    try {
        await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        );
    } catch (error) {
        console.error("Database error in createUser:", error);
        throw error;
    }
}

async function getUserById(userId) {
    try {
        const result = await pool.query(
            'SELECT id, username, description, is_candidate FROM users WHERE id = $1',
            [userId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Database error in getUserById:", error);
        throw error;
    }
}

async function getCandidateById(candidateId) {
    try {
        const result = await pool.query(
            'SELECT id, username, description, is_candidate FROM users WHERE id = $1 AND is_candidate = TRUE',
            [candidateId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Database error in getCandidateById:", error);
        throw error;
    }
}

async function updateUserDescription(userId, description) {
    try {
        await pool.query(
            'UPDATE users SET description = $1 WHERE id = $2',
            [description, userId]
        );
    } catch (error) {
        console.error("Database error in updateUserDescription:", error);
        throw error;
    }
}

initializeDB();

module.exports = { 
    pool, 
    setUserAsCandidate, 
    hasUserVoted, 
    castVote, 
    getCandidates, 
    getUserByUsername, 
    getCandidatesWithVotes, 
    createUser,
    getUserById,
    getCandidateById,
    updateUserDescription
};