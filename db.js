 const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
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
                has_voted BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS voting_rounds (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS candidates_per_round (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                round_id INT NOT NULL REFERENCES voting_rounds(id) ON DELETE CASCADE,
                CONSTRAINT unique_candidate_per_round UNIQUE (user_id, round_id)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                voter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                candidate_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                round_id INT NOT NULL REFERENCES voting_rounds(id) ON DELETE CASCADE,
                CONSTRAINT unique_vote_per_round UNIQUE (voter_id, round_id) 
            );
        `);
        
    } catch (error) {
        console.error("Database initialization error:", error);
        throw error;
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

async function hasUserVotedInRound(userId, roundId) {
    try {
        const result = await pool.query(`
            SELECT * FROM votes WHERE voter_id = $1 AND round_id = $2;
        `, [userId, roundId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error("Database error in hasUserVotedInRound:", error);
        throw error;
    }
}

async function voteInRound(voterId, candidateId, roundId) {
    try {
        await pool.query(`
            INSERT INTO votes (voter_id, candidate_id, round_id) VALUES ($1, $2, $3);
        `, [voterId, candidateId, roundId]);

        await pool.query(`
            UPDATE users 
            SET is_public = TRUE 
            WHERE id = $1 AND NOT is_public;
        `, [candidateId]);

    } catch (error) {
        console.error("Database error in voteInRound:", error);
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
            'SELECT id, username, password, is_admin FROM users WHERE username = $1', 
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
        const result = await pool.query(`
            SELECT id, username, description, is_candidate, is_public 
            FROM users 
            WHERE id = $1;
        `, [userId]);

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

async function createVotingRound(name, startTime, endTime) {
    try {
        await pool.query(
            'INSERT INTO voting_rounds (name, start_time, end_time) VALUES ($1, $2, $3)',
            [name, startTime, endTime]
        );
    } catch (error) {
        console.error("Database error in createVotingRound:", error);
        throw error;
    }
}

async function getActiveVotingRounds() {
    try {
        const result = await pool.query(
            'SELECT * FROM voting_rounds WHERE end_time > NOW() ORDER BY start_time ASC'
        );
        return result.rows;
    } catch (error) {
        console.error("Database error in getActiveVotingRounds:", error);
        throw error;
    }
}

async function getPastVotingRounds() {
    try {
        const result = await pool.query(
            'SELECT * FROM voting_rounds WHERE end_time <= NOW() ORDER BY end_time DESC'
        );
        return result.rows;
    } catch (error) {
        console.error("Database error in getPastVotingRounds:", error);
        throw error;
    }
}

async function getCandidatesByRound(roundId) {
    try {
        const result = await pool.query(`
            SELECT users.id, users.username, COALESCE(vote_counts.votes, 0) AS votes
            FROM users
            JOIN candidates_per_round ON users.id = candidates_per_round.user_id
            LEFT JOIN (
                SELECT candidate_id, COUNT(*) AS votes
                FROM votes
                WHERE round_id = $1
                GROUP BY candidate_id
            ) AS vote_counts ON users.id = vote_counts.candidate_id
            WHERE candidates_per_round.round_id = $1
            ORDER BY votes DESC;
        `, [roundId]);
        return result.rows;
    } catch (error) {
        console.error("Database error in getCandidatesByRound:", error);
        throw error;
    }
}

async function addCandidateToRound(userId, roundId) {
    try {
        await pool.query(`
            INSERT INTO candidates_per_round (user_id, round_id) VALUES ($1, $2) 
            ON CONFLICT DO NOTHING;
        `, [userId, roundId]);
    } catch (error) {
        console.error("Database error in addCandidateToRound:", error);
        throw error;
    }
}

async function getCandidatesByPastRound(roundId) {
    try {
        const result = await pool.query(`
            SELECT users.id, users.username, COALESCE(COUNT(votes.id), 0) AS votes
            FROM users
            JOIN candidates_per_round ON users.id = candidates_per_round.user_id
            LEFT JOIN votes ON users.id = votes.candidate_id AND votes.round_id = $1
            WHERE candidates_per_round.round_id = $1
            GROUP BY users.id, users.username
            ORDER BY votes DESC;
        `, [roundId]);
        return result.rows;
    } catch (error) {
        console.error("Database error in getCandidatesByPastRound:", error);
        throw error;
    }
}

async function updateUserVisibility(userId, isPublic) {
    const query = `UPDATE users SET is_public = $1 WHERE id = $2`;
    await pool.query(query, [isPublic, userId]);
}

initializeDB();

module.exports = { 
    pool,
    initializeDB,
    setUserAsCandidate, 
    hasUserVotedInRound, 
    voteInRound, 
    getCandidates, 
    getUserByUsername, 
    getCandidatesWithVotes, 
    createUser,
    getUserById,
    getCandidateById,
    updateUserDescription,
    createVotingRound,
    getActiveVotingRounds,
    getPastVotingRounds,
    getCandidatesByRound,
    addCandidateToRound,
    getCandidatesByPastRound,
    updateUserVisibility
};
