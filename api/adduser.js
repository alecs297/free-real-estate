// Vérifie la présence des paramètres et fait passer la demande d'enregistrement

exports.run = async(data, path, req, res) => {
    if (req.body && req.body.username) {
        data.auth.createUser(data, req.body.username, req, res);
    } else {
        res.json({ error: "Paramètres incomplets" });
    }
}
exports.disabled = false;
exports.admin_only = true;
exports.method = "POST";
exports.captcha = true;