// DEPENDENCIES
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const moment = require('moment');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET is not set. Add it to your environment.');
    process.exit(1);
}
const expressSession = require('express-session')({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: isProd }
});

// IMPORT MODELS
const User = require('./models/Users');      
const Message = require('./models/Message'); 

// IMPORT ROUTES
const indexRoutes = require('./routes/indexRoutes');
const contactRoutes = require('./routes/contactRoutes');
const formRoutes = require('./routes/formRoutes');
const aboutRoutes = require('./routes/aboutRoutes');


// INSTANTIATIONS
const app = express();
const port = process.env.PORT || 3012;
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);


// CONFIGURATIONS
app.locals.moment = moment;
mongoose.connect(process.env.DATABASE).catch(() => {
    console.error('Database connection failed.');
});
mongoose.connection
  .once('open', () => {
    console.log('Mongoose Connection Open!')
  })
  .on('error', (error) => {
    console.error(`Connection Error: ${error.message}`);
  });

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


// MIDDLEWARE
// Redirect HTTP -> HTTPS in production (requires TRUST_PROXY behind a proxy)
if (isProd) {
    app.use((req, res, next) => {
        if (req.secure) return next();
        res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    });
}

// Per-request nonce so the page's inline script can run under the CSP
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', (req, res) => `'nonce-${res.locals.nonce}'`],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: isProd ? [] : null
        }
    },
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    next();
});

app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

// Passport Config
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// USE IMPORTED ROUTES
app.use('/', indexRoutes);
app.use('/about', aboutRoutes);
app.use('/contact', contactRoutes);
app.use('/form', formRoutes);


// CONTACT FORM POST ROUTE — validates and saves message to MongoDB
const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).send('Too many messages. Please try again later.')
});
const SUBJECTS = ['freelance', 'parttime', 'fulltime', 'collaboration', 'other'];
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

app.post('/form/submit', formLimiter, async (req, res) => {
    try {
        const body = req.body || {};
        // Honeypot: bots fill the hidden field; pretend success and drop it
        if (str(body.website, 100)) return res.redirect('/form?success=true');

        const data = {
            name: str(body.name, 100),
            company: str(body.company, 100),
            email: str(body.email, 254).toLowerCase(),
            phone: str(body.phone, 30),
            address: str(body.address, 200),
            subject: SUBJECTS.includes(body.subject) ? body.subject : '',
            message: str(body.message, 5000)
        };
        if (!data.name || !data.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            return res.status(400).send('Please provide a valid name, email and message.');
        }
        await new Message(data).save();
        res.redirect('/form?success=true');
    } catch (error) {
        console.error('Failed to save message:', error.name);
        res.status(500).send('Error saving message');
    }
});


// 404 — For Non-Existing Routes
app.use((req, res) => {
    res.status(404).send('Oops! Route not found!');
});


// Generic error handler — never leak stack traces or internals
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.name);
    res.status(err.status || 500).send('Something went wrong.');
});

app.listen(port, () => console.log(`Listening on port ${port}`));