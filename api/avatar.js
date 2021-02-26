// Sert une image à partir d'un flux base64

exports.run = async(data, path, req, res, next) => {
    if (path[2]) {
        const user = data.db.prepare("SELECT * FROM users WHERE username = ?;").get(path[2]);
        if (user) {
            const img = Buffer.from(user.img.split(",")[1], 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            });
            res.end(img);
        } else {
            res.json({ error: "invalid" });
        }
    } else {
        next();
    }
}
exports.disabled = false;
exports.admin_only = true;
exports.method = "GET";