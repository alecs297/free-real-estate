// Mise en cache de chaque fichier .js de /api/

const fs = require('fs');
module.exports = {
    load: async function(data) {
        await fs.readdir("./api/", (err, files) => {

            if (err) return console.log("Error loading api routes folder " + err);

            files.forEach(file => {

                if (!file.endsWith(".js")) return;
                // Don't asky why the path is different.
                let props = require(`./../api/${file}`);
                let commandName = file.split(".")[0];

                data.set(commandName, props);
            });

        });
        return data;
    }
}