const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const profileRoute = require('./routes/profile');
const candidacyRoute = require('./routes/candidacy');
const candidatesRoute = require('./routes/candidates');
const voteRoute = require('./routes/vote');
const homeRoute = require('./routes/home');
const historyRoutes = require('./routes/history');
const adminRoute = require('./routes/admin');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60
    }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use('/', homeRoute);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/profile', profileRoute);
app.use('/candidacy', candidacyRoute);
app.use('/candidates', candidatesRoute);
app.use('/vote', voteRoute);
app.use('/history', historyRoutes);
app.use('/admin', adminRoute);

app.listen(PORT);