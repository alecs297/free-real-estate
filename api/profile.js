// Génère un json contenant les données publiques d'un compte

exports.run = async(data, path, req, res, next) => {
    if (path[2]) {
        const user = data.db.prepare("SELECT * FROM users WHERE username = ?;").get(path[2]);
        if (user) {
            res.status(200).json({
                username: user.username,
                name: user.name,
                bio: user.bio,
                createdAt: user.createdAt,
                roles: JSON.parse(user.roles)
            });
        } else {
            res.json({ error: "invalide" });
        }
    } else {
        next();
    }
}
exports.disabled = false;
exports.user_only = false;
exports.admin_only = true;
exports.method = "GET";