require("dotenv").config();
const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const axios = require("axios");
const requestIp = require("request-ip");
const { EmbedBuilder } = require("discord.js");
const { initDB, getDbC, getDbP, updateUsers } = require("../databases/index");
const { website1 } = require("../functions/website1");

const TOKEN = process.env.DISCORD_BOT_TOKEN;

router.get("/api/callback", async (req, res) => {
  try {
    await initDB();

    const clientid = await getDbP("autoSet.clientid", process.env.clientid);
    const guild_id = await getDbP("autoSet.guildid", process.env.guild_id);
    const secret = await getDbP("manualSet.secretBot", process.env.secret);
    const role = await getDbC("roles.verify", null);
    const status = (await getDbC("sistema", true)) ?? true;
    if (!status) return res.status(400).json({ message: "Oauth2 desligado", status: 400 });

    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "Faltando query `code`", status: 400 });

    const redirectUri = `${process.env.url_apiHost}/api/callback`;

    // ⚡ Troca do code por token
    let tokenData;
    try {
      const params = new URLSearchParams();
      params.append("client_id", clientid);
      params.append("client_secret", secret);
      params.append("code", code);
      params.append("grant_type", "authorization_code");
      params.append("redirect_uri", redirectUri);
      params.append("scope", "identify email guilds.join");

      const responseToken = await axios.post(
        "https://discord.com/api/oauth2/token",
        params.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      tokenData = responseToken.data;
    } catch (err) {
      if (err.response?.data?.error === "invalid_grant") {
        return res.status(400).json({ message: "❌ Código expirado ou inválido. Tente novamente.", status: 400 });
      }
      throw err;
    }

    // ⚡ Pega dados do usuário
    const responseUser = await axios.get("https://discord.com/api/users/@me", {
      headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` }
    });

    const user = responseUser.data;
    const ip = requestIp.getClientIp(req);

    // ⚡ Adiciona role no servidor
    if (role) {
      await axios.patch(
        `https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`,
        { roles: [role] },
        { headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" } }
      ).catch(() => null);
    }

    // ⚡ Atualiza ou cria usuário no banco
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

    // ⚡ Mostra página de sucesso
    await website1(res, guild_id);

  } catch (err) {
    console.error("Erro no callback:", err);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
});

module.exports = router;
