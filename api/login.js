const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const { dbP } = require("../databases/index");
const { url_apiHost } = require("../config.json");

router.get("/skyoauth2/login", async (req, res) => {

    const clientid = await dbP.get("autoSet.clientid");
    const secret = await dbP.get("manualSet.secretBot");

    try {
        res.redirect(oauth.generateAuthUrl({
            clientId: clientid,
            clientSecret: secret,
            scope: ["identify", "guilds.join", "email"],
            redirectUri: `${url_apiHost}/api/callback`
        }));
    } catch (err) {
        res.status(500).json({
            message: `${err.message}`,
            status: 500
        });
    };

});

module.exports = router;
