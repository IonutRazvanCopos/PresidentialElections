const express = require('express');
const { getCandidates } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const candidates = await getCandidates();
        res.render('candidates', { candidates });
    } catch (error) {
        res.render('candidates', { candidates: [] });
    }
});

module.exports = router;