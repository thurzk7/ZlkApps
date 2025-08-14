const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const { getDbP } = require("../databases/index"); 
const { url_apiHost } = require("../config.json");

router.get("/skyoauth2/login", async (req, res) => {
    try {
        const clientid = await getDbP("autoSet.clientid");
        const secret   = await getDbP("manualSet.secretBot");

        // gera URL de login OAuth2
        const authUrl = oauth.generateAuthUrl({
            clientId: clientid,
            clientSecret: secret,
            scope: ["identify", "guilds.join", "email"],
            redirectUri: `${url_apiHost}/api/callback`
        });

        res.redirect(authUrl);
    } catch (err) {
        res.status(500).json({
            message: `${err.message}`,
            status: 500
        });
    }
});

module.exports = router;
