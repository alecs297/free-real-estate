// Fait passer la demande de déconnexion

exports.run = async(data, path, req, res) => {
    data.auth.logout(req, res);
}
exports.disabled = false;
exports.user_only = false;
exports.method = "GET";