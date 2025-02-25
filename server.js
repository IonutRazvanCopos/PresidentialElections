const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const { verifyToken } = require('./middleware/auth');
const path = require('path');
const pool = require('./db');
require('dotenv').config();

const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const profileRoute = require('./routes/profile');
const candidacyRoute = require('./routes/candidacy');
const candidatesRoute = require('./routes/candidates');
const voteRoute = require('./routes/vote');
const homeRoute = require('./routes/home');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use('/profile', (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}, profileRoute);

app.use('/', homeRoute);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/profile', verifyToken, profileRoute);
app.use('/candidacy', verifyToken, candidacyRoute);
app.use('/candidates', verifyToken, candidatesRoute);
app.use('/vote', verifyToken, voteRoute);
app.use('/profile', verifyToken, profileRoute);

app.listen(PORT);