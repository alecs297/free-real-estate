// Gestion basique de la base de données et définition de quelques fonctions utiles
module.exports = {
    initUsers: function () {
        const init = this.db.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'users';").get();
        if (!init['count(*)']) {
            console.log("Recreating users tables.");
            // Creation des tables
            this.db.prepare("CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, name TEXT, mail TEXT, password TEXT, salt TEXT, _2fa TEXT, phone TEXT, createdAt TEXT, updatedAt TEXT, lastIp TEXT, bio TEXT, img TEXT, disabled INTEGER, deletedOn TEXT, roles TEXT);").run();
            // ID unique
            this.db.prepare("CREATE UNIQUE INDEX idx_users_id ON users (id);").run();
            // Je sais pas trop mais sinon ça marche pas sans
            this.db.pragma("synchronous = 1");
            this.db.pragma("journal_mode = wal");
        }
        // Fonctions à définir après que la base ait été crée quoi.
        this.getUserById = this.db.prepare("SELECT * FROM users WHERE id = ?;");
        this.getUserByUsername = this.db.prepare("SELECT * FROM users WHERE username = ?;");
        this.getUserByMail = this.db.prepare("SELECT * FROM users WHERE mail = ?;");
        this.setUser = this.db.prepare("INSERT OR REPLACE INTO users (id, username, name, mail, password, salt, _2fa, phone, createdAt, updatedAt, lastIp, bio, img, disabled, deletedOn, roles) VALUES (@id, @username, @name, @mail, @password, @salt, @_2fa, @phone, @createdAt, @updatedAt, @lastIp, @bio, @img, @disabled, @deletedOn, @roles);");
    },

    // Génération d'un ID unique de 15 caractères
    generateId: function () {
        let id = "";
        do {
            for (let i=0; i<15; i++) {
                id += Math.floor(Math.random()*10);
            }
        } while (this.getUserById.get(id));
        return `${id}`;
    },

    // Initialisation d'un nouveau compte utilisateur
    initUser: async function (username, mail, password, salt, lastIp) {
        let user = {
            id: module.exports.generateId(),
            username: username,
            name: username,
            mail: mail,
            password: password,
            salt: salt,
            _2fa: "",
            phone: "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastIp: lastIp,
            bio: "",
            img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAMAAAD8CC+4AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQyIDc5LjE2MDkyNCwgMjAxNy8wNy8xMy0wMTowNjozOSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjU5Q0Q2NzIzQ0FCNTExRUE4MEFEQTYzNEE0MkEwMEMwIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjU5Q0Q2NzI0Q0FCNTExRUE4MEFEQTYzNEE0MkEwMEMwIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NTlDRDY3MjFDQUI1MTFFQTgwQURBNjM0QTQyQTAwQzAiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NTlDRDY3MjJDQUI1MTFFQTgwQURBNjM0QTQyQTAwQzAiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz69eU6IAAAABlBMVEWenp7///+xHOcIAAADZ0lEQVR42uzXgU0DQRAEQZN/0iQAEli+//3tqgSQpm9t83oBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKd8/cgumdTq53tLn+2tfDa47tHiwkeL6x5NLnuxuO7R5LInk8ueTC57MrnszeayF5PLnkyuerK57MXkqiebq15sLnuyuerB5Konm6tebC57srnqxeaqF5urXmyuerG56sXmqhebqz6++ZF3JM7U6AefkzgTm59+UvJMa37FsxJoVPOJf4aTNS58XRrNaD78fTGm+fV/jo9VuP6V6XRz88c9M25vfttf5e35H/zWeG/8hz823tj+8R8xvG7dXfRHRN/05DS/aXTRx0df+Oo0v2Nx0UdH3/vwNL98b9Fzh+7Ui82d+tjoiden+ZVTi547dNFHRi89QM0v21n03KGLnoyuenJk0UUXPbGx6MGvUKdeXFh00UUvfJSKXvz+VF100Qvzil7870h00UUvfI6KLrroiV9Mogd/JYsuuuqii75yWtFFFz3w6e6XnOiiiy760i9O0UUXXXTRRefj275E77UfHF25U1M79GB70YPxRUd0REd0zjYXXXR8uuPQER3R0RzRmdJcdNHRHNFZ0Vx0h45DZ2Nz0R06Dh3N2dBcdM0JNBfdoePQ0ZwNzUXXnEBz0TVHcxY2F11zNEdzFjQXXXP2J9dccwLNRdcczdEczdEczdGc+5NrHmwuuuZojuZojuZojuZojuacb241zdEczdGc50U3muZojuZojuaMj24yzdGcfdEtpjmasy+6wTRHc/ZFt5fm7I9uLs3ZH91amrM/urE0Z390Wzl0HDoLo5tKc0RHcxZEt5ToBKIbyqHj0BEdzREd0ZkZ3U6i49Mdh47oiM4zoptJdHy6Izqi4ysd0REd0REd0REd0RGd/0W3kuiIjuiIjuiIjuiIjuiIjuiIjuiILrrooosOAAAAAAAAAAAAAAAAAAD87uvvjCU6oiM6oiM6oiM6oiM6oiM6oiM6oosuuuiiiy666IiO6IiO6IiO6IiO6IiO6IiO6Iguuuiiiy666KIjOqIjOqIjOqIjOgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADARt8CDAAul0IDMTjX2gAAAABJRU5ErkJggg==",
            disabled: 0,
            deletedOn: "never",
            roles: "[]"
        }
        await this.setUser.run(user);
        return user;
    }
}