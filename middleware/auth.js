const jwt = require('jsonwebtoken');

const SECRET_KEY = 'super_secret_key';

function verifyToken(req, res, next) {
    const token = req.session.token;

    if (!token) {
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("❌ Token invalid:", error);
        return res.redirect('/login');
    }
}

module.exports = { verifyToken };