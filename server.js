/**
 * Fichier: Point d'entrée du serveur
 * 
 * Déclaration des dépendances
 */

// Objets serveur
const express = require('express');
const app = require('express')();
const server = require('http').createServer(app);
// Dépendances pour les sessions utilisateur
const session = require('express-session');
// Dépendances pour base de données, routes et chemins fixes
const SQLite = require("better-sqlite3");
const Enmap = require("enmap");
const path = require('path');

/**
 * Déclaration de la base de données et des routes
 */

const routes = new Enmap();
const data = require('./utils/db.js');
const { checkCaptcha } = require('./utils/auth.js');

data.routesHandler = require('./utils/routeshandler.js');
data.errors = require('./html/errors/errors.js');
data.auth = require('./utils/auth.js');
data.db = new SQLite('./data/db.sqlite');
data.settings = require('./settings.json');

/**
 * Initialisation du serveur et des dépendances
 */

// Mise en place de la base de données
data.initUsers();
// Chargement des routes API depuis le dossier
data.routesHandler.load(routes);
// Intégration des sessions au serveur
app.use(session({
    secret: data.settings.cookies_secret,
    resave: true,
    saveUninitialized: false,
    name: "cowokie"
}));
// Utile pour la détection des IPs et plus tard si utilisé sous proxy
app.set('trust proxy', true);
// Utile pour traiter les données POST
app.use(express.urlencoded({ extended: true }))

/**
 * Routage des requêtes
 */

// Fichiers statiques en priorité
app.use('/', express.static('./html/static'));
// Assets également statiques, peut être à fusionner plus tard avec le html?
app.use('/assets', express.static('./html/assets'));
// API envoie vers les différentes routes avec leurs spécificités
app.use('/api/', async function(req, res, next) {
    const path = (req.path).split('/');
    const endpoint = routes.get(path[1]);
    if (endpoint && !endpoint.disabled) {
        if ((endpoint.user_only && !req.session.username) || (endpoint.admin_only && !req.session.admin)) {
            return data.errors.handle(401, req, res);
        }
        if (endpoint.captcha && endpoint.method === "POST" && (req.method !== "POST" || !req.body || !req.body['g-recaptcha-response'] || !checkCaptcha(data, req.body['g-recaptcha-response']))) {
            return res.json({ error: "Mauvais captcha" });
        }
        if (endpoint.method === req.method) {
            endpoint.run(data, path, req, res, next);
        } else {
            res.json({ error: "Mauvaise requête" });
        }
    } else {
        res.json({ error: "Service actuellement désactivé" });
    }
});
// Profils seront servis seulement s'ils existent et précédés de @
app.get('/@*', async function(req, res, next) {
    const user = data.db.prepare("SELECT * FROM users WHERE username = ?;").get(req.path.slice(2));
    if (user) {
        res.sendFile(__dirname + '/html/static/profile.html');
    } else {
        next();
    }
});
// Paramètres de l'utilisateur connecté
app.get("/panel", async function(req, res) {
    res.json(req.session);
});
// Erreur 404.
app.use('*', async function(req, res) {
    data.errors.handle(404, req, res);
});

// Petit rappel, le settings.json est à configurer (:
server.listen(data.settings.port);