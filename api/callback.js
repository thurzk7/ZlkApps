require("dotenv").config();
const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const { initDB, getDbP, updateUsers } = require("../databases/index");
const TOKEN = process.env.DISCORD_BOT_TOKEN;

router.get("/api/callback", async (req, res) => {
    try {
        await initDB();

        const clientid = await getDbP("autoSet.clientid");
        const secret = await getDbP("manualSet.secretBot");
        const guild_id = await getDbP("autoSet.guildid");
        const role = await getDbP("roles.verify", null);

        const { code } = req.query;
        if (!code) return res.status(400).json({ message: "❌ Código inválido", status: 400 });

        // Troca code por access_token
        const redirectUri = `${process.env.url_apiHost}/api/callback`;
        const tokenResponse = await oauth.tokenRequest({
            clientId: clientid,
            clientSecret: secret,
            code,
            scope: "identify email guilds.join",
            grantType: "authorization_code",
            redirectUri
        });

        const accessToken = tokenResponse.access_token;
        const refreshToken = tokenResponse.refresh_token;

        // Pega info do usuário
        const user = await oauth.getUser(accessToken);

        // Adiciona role no servidor
        if (role) {
            await oauth.addMemberRole({
                botToken: TOKEN,
                guildId: guild_id,
                userId: user.id,
                roleId: role
            }).catch(() => null);
        }

        // Salva dados no DB
        await updateUsers(
            { _id: user.id },
            {
                username: user.username,
                accessToken,
                refreshToken,
                code,
                email: user.email
            }
        );

        return res.send(`✅ Usuário ${user.username} verificado com sucesso!`);
    } catch (err) {
        console.error("Erro no callback:", err);
        return res.status(500).json({ message: "Erro interno no servidor", status: 500 });
    }
});

module.exports = router;
