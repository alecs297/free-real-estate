module.exports = {
    handle: async function (code, req, res) {
        res.status(code).sendFile(__dirname + '/' + code + '.html');
    }
}