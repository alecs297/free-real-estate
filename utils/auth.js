// Fonctions de la gestion de connexion, enregistrement et vérification

const crypto = require('crypto');
const _2fa = require('speakeasy');
const unirest = require('unirest')

module.exports = {

    // Vérification du mot de passe: (8-16 chars)(low et CAP)(0-9 et/ou caractère spécial)
    checkPassword: function(password) {
        return (/(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(password) && password.length < 17); // https://gist.github.com/ravibharathii/3975295 et limite à 16 chars
    },

    // Vérification du numéro de téléphone
    checkPhone: function(phone) {
        return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(phone);
    },

    // Vérification de l'adresse mail (tout domaine accepté)
    checkMail: function(mail) {
        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(mail);
    },

    // Vérification du nom d'utilisateur (1-16 chars)(low et/ou CAP)(_ et - acceptées)
    checkUsername: function(username) {
        return /^[a-z0-9_-]{1,16}$/.test(username);
    },

    // Vérifie si username disponible
    checkAvailableUsername: function(data, username) {
        return !data.getUserByUsername.get(username);
    },

    // Vérifie si mail non existant
    checkAvailableMail: function(data, mail) {
        return !data.getUserByMail.get(mail);
    },

    // Génère un salt
    genSalt: function() {
        return crypto.randomBytes(8).toString('hex').slice(0, 16);
    },

    // Génère un token 2fa
    gen2FASecret: function(data, username) {
        return _2fa.generateSecret(
            {
                length: 32,
                symbols: false,
                name: `@${username} (${data.settings.name})`
            }
        )
    },

    // Génère un code 2fa
    gen2FACode: function(secret) {
        return _2fa.totp({
            secret: secret,
            encoding: 'base32'
          });
    },

    // Hash un mdp avec un salt
    hashPass: function(password, salt) {
        let hash = crypto.createHmac('sha512', salt);
        hash.update(password);
        return hash.digest('hex');
    },

    // Génère un salt et hash un mdp
    saltHashPass: function(userpass) {
        let salt = this.genSalt();
        let password = this.hashPass(userpass, salt);
        return {
            salt: salt,
            password: password
        }
    },

    // Vérifie un token 2FA
    check2FA: async function(data, code, username) {
        let user = await data.getUserByUsername.get(username);
        if (user && user._2fa && code) {
            let r = await _2fa.totp.verify({
                secret: user._2fa,
                encoding: 'base32',
                token: code,
                window: 1
            })
            return r;
        }
        return false;
    },

    // Vérifie la vérification Captcha
    checkCaptcha: async function(data, token, action) {
        let res;
        await unirest.post(`https://www.google.com/recaptcha/api/siteverify`).send({secret: data.settings.recaptcha_secret, response: token}).then(async response => {
            if (response.body) {
                res = response.body;
            }
        });
        return (res && res.success && res.hostname === data.settings.hostname)
    },

    // Vérifie une combinaison login/mdp (mail ou username) puis authentifie la session + check code 2fa si existant
    checkLogin: async function(data, login, password, req, res) {
        let user;
        if (this.checkMail(login)) {
            user = await data.getUserByMail.get(login);
        } else if (this.checkUsername(login)) {
            user = await data.getUserByUsername.get(login);
        }
        if (user) {
            if (user.password === this.hashPass(password, user.salt)) {
                if (user._2fa) {
                    if (!await this.check2FA(data, req.body._2fa, user.username)) {
                        return res.json({error: "Le code de double authentification n'est pas valide.", _2fa: true});
                    }
                }
                req.session.username = user.username;
                req.session.id = user.id;
                req.session.mail = user.mail;
                res.json({url: "/panel"});
            } else {
                res.json({error: "Mauvaise combinaison login / mot de passe"});
            }
        } else {
            res.json({error: "Ce login n'existe pas"})
        }
    },

    // Génère un hash et crée un compte utilisateur
    executeRegistration: async function(data, username, mail, userpass, ip) {
        let value = this.saltHashPass(userpass);
        await data.initUser(username, mail, value.password, value.salt, ip);
    },

    // Traite la demande de login
    login: async function(data, login, password, req, res) {
        if (!req.session.username) {
            await this.checkLogin(data, login, password, req, res);
        } else {
            res.redirect("/panel");
        }
    },

    // Traite l'enregistrement puis authentifie la session
    register: async function(data, mail, username, password, req, res) {
        if (!req.session.username) {
            if (this.checkMail(mail) && this.checkPassword(password) && this.checkUsername(username)) {
                if (this.checkAvailableMail(data, mail) && this.checkAvailableUsername(data, username)) {
                    await this.executeRegistration(data, username, mail, password, req.ip);
                    let user = await data.getUserByUsername.get(username);
                    req.session.username = user.username;
                    req.session.id = user.id;
                    req.session.mail = user.mail;
                    res.json({url: "/panel"});
                } else {
                    res.json({error: "Nom d'utilisateur / email déjà utilisé"});
                }
            } else {
                res.json({error: "Mauvais formattage"});
            }
        } else {
            res.json({url: "/panel"});
        }
    },

    // Détruit la session actuelle
    logout: async function(req, res) {
        req.session.destroy();
        res.redirect("/bye");
    }
}