const express = require('express');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    console.log("🔍 Request primit în /vote:", req.body);

    if (!req.session || !req.session.user) {
        console.log("❌ Utilizatorul nu este logat. Redirecționare la login.");
        return res.redirect('/login');
    }

    const { candidate_id } = req.body;

    if (!candidate_id) {
        console.log("❌ `candidate_id` este gol! Formularul nu trimite date corect.");
        return res.redirect("/?errorMessage=Eroare: nu ai selectat un candidat.");
    }

    console.log(`🔍 Utilizator ${req.session.user.id} încearcă să voteze pentru ${candidate_id}`);

    try {
        const checkVote = await pool.query('SELECT * FROM votes WHERE voter_id = $1', [req.session.user.id]);
        console.log("🔍 Verificare vot existent:", checkVote.rows);

        if (checkVote.rows.length > 0) {
            console.log("❌ Utilizatorul a votat deja.");
            return res.redirect('/?errorMessage=Ai votat deja și nu poți vota din nou!');
        }

        const insertVote = await pool.query(
            'INSERT INTO votes (voter_id, candidate_id) VALUES ($1, $2) RETURNING *',
            [req.session.user.id, candidate_id]
        );
        console.log("✅ Vot înregistrat în DB:", insertVote.rows);

        return res.redirect('/?successMessage=Votul a fost înregistrat cu succes!');
    } catch (error) {
        console.error("❌ Eroare la vot:", error);
        return res.redirect('/?errorMessage=Eroare la vot. Încercați din nou.');
    }
});

module.exports = router;