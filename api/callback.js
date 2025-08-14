require("dotenv").config();
const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const { initDB, getDbC, getDbP, updateUsers } = require("../databases/index");
const requestIp = require("request-ip");
const axios = require("axios");

const TOKEN = process.env.DISCORD_BOT_TOKEN;

router.get("/api/callback", async (req, res) => {
    try {
        await initDB();

        const clientid = await getDbP("autoSet.clientid", process.env.clientid);
        const guild_id = await getDbP("autoSet.guildid", process.env.guild_id);
        const secret = await getDbP("manualSet.secretBot", process.env.secret);
        const role = await getDbC("roles.verify", null);

        const ip = requestIp.getClientIp(req);
        const { code } = req.query;

        if (!code) return res.status(400).json({ message: "📡 | Está faltando query `code`", status: 400 });

        const redirectUri = `${process.env.url_apiHost}/api/callback`;

        const params = new URLSearchParams();
        params.append("client_id", clientid);
        params.append("client_secret", secret);
        params.append("code", code);
        params.append("grant_type", "authorization_code"); // primeiro acesso
        params.append("redirect_uri", redirectUri);
        params.append("scope", "identify email guilds.join");

        let tokenData;
        try {
            const response = await axios.post(
                "https://discord.com/api/oauth2/token",
                params.toString(),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );
            tokenData = response.data;
        } catch (err) {
            if (err.response?.data?.error === "invalid_grant") {
                return res.status(400).json({ message: "❌ Código expirado ou inválido. Gere um novo login.", status: 400 });
            }
            throw err;
        }

        // busca dados do usuário
        const responseUser = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` }
        });

        const user = responseUser.data;

        // atribui role no servidor
        if (role) {
            const guildMemberResponse = await axios.get(
                `https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`,
                { headers: { Authorization: `Bot ${TOKEN}` } }
            ).catch(() => null);

            if (guildMemberResponse) {
                const currentRoles = guildMemberResponse.data.roles;
                const newRoles = [...new Set([...currentRoles, role])];

                await axios.patch(
                    `https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`,
                    { roles: newRoles },
                    { headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" } }
                ).catch(() => null);
            }
        }

        // salva tokens no banco
        await updateUsers(
            { _id: user.id },
            {
                username: user.username,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                code,
                email: user.email,
                ipuser: ip
            }
        );

        res.send(`✅ Usuário ${user.username} verificado com sucesso!`);
    } catch (err) {
        console.error("Erro no callback:", err);
        return res.status(500).json({ message: "Erro interno no servidor", status: 500 });
    }
});

module.exports = router;
