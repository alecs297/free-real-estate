// Vérifie la présence des paramètres et fait passer la demande d'enregistrement

exports.run = async(data, path, req, res) => {
    if (req.body && req.body.mail && req.body.username && req.body.password) {
        data.auth.register(data, req.body.mail, req.body.username, req.body.password, req, res);
    } else {
        res.json({ error: "Paramètres incomplets" });
    }
}
exports.disabled = true;
exports.method = "POST";
exports.captcha = true;