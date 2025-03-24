const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/user');
const homeRoute = require('./routes/home');
const roundRouter = require('./routes/round');

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
    res.locals.currentPath = req.path;
    next();
});

app.use('/', homeRoute);
app.use('/user', userRoutes);
app.use('/round', roundRouter);

app.get('/login', (req, res) => {
    res.redirect('/user/login');
});

app.get('/register', (req, res) => {
    res.redirect('/user/register');
});

app.get('/profile', (req, res) => {
    res.redirect('/user/profile');
});

app.get('/admin', (req, res) => {
    res.redirect('/user/admin');
});

app.listen(PORT);