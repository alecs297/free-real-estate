// Vérifie la présence paramètres et fait passer la demande de connexion

exports.run = async(data, path, req, res) => {
    if (req.body && req.body.username && req.body.password) {
        data.auth.login(data, req.body.username, req.body.password, req, res);
    } else {
        res.json({ error: "Paramètres incomplets" });
    }
}
exports.disabled = false;
exports.method = "POST";
exports.captcha = false;