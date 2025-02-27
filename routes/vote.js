const express = require('express');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    const { candidate_id } = req.body;
    if (!candidate_id) {
        return res.redirect("/?errorMessage=Eroare: nu ai selectat un candidat.");
    }
    try {
        const checkVote = await pool.query('SELECT * FROM votes WHERE voter_id = $1', [req.session.user.id]);
        if (checkVote.rows.length > 0) {
            return res.redirect('/?errorMessage=Ai votat deja și nu poți vota din nou!');
        }
        const insertVote = await pool.query(
            'INSERT INTO votes (voter_id, candidate_id) VALUES ($1, $2) RETURNING *',
            [req.session.user.id, candidate_id]
        );
        return res.redirect('/?successMessage=Votul a fost înregistrat cu succes!');
    } catch (error) {
        return res.redirect('/?errorMessage=Eroare la vot. Încercați din nou.');
    }
});

module.exports = router;