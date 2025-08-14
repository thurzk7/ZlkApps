require("dotenv").config();
const { EmbedBuilder } = require("discord.js");
const { initDB, getDbC, getDbP, updateUsers } = require("../databases/index");
const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const requestIp = require("request-ip");
const axios = require("axios");
const { website1 } = require("../functions/website1");

const TOKEN = process.env.DISCORD_BOT_TOKEN;

router.get("/api/callback", async (req, res) => {
  try {
    await initDB();

    const clientid = await getDbP("autoSet.clientid", process.env.clientid);
    const guild_id = await getDbP("autoSet.guildid", process.env.guild_id);
    const secret = await getDbP("manualSet.secretBot", process.env.secret);
    const webhook_logs = await getDbP("manualSet.webhook", process.env.webhook_logs) || null;
    const role = await getDbC("roles.verify", null);
    const status = (await getDbC("sistema", true)) ?? true;

    if (!status) return res.status(400).json({ message: "`🔴` Oauth2 está desligado", status: 400 });

    const ip = requestIp.getClientIp(req);
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "📡 | Está faltando query `code`", status: 400 });

    // URL exata registrada no Discord Developer Portal
    const redirectUri = `${process.env.url_apiHost}/api/callback`;

    // 1️⃣ Troca o código por token
    let tokenData;
    try {
      const params = new URLSearchParams();
      params.append("client_id", clientid);
      params.append("client_secret", secret);
      params.append("code", code);
      params.append("grant_type", "authorization_code");
      params.append("redirect_uri", redirectUri);
      params.append("scope", "identify email");

      const response = await axios.post(
        "https://discord.com/api/oauth2/token",
        params.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      tokenData = response.data;
    } catch (err) {
      return res.status(400).json({ message: "❌ Código expirado ou inválido. Gere um novo login.", status: 400 });
    }

    // 2️⃣ Pega dados do usuário
    const responseUser = await axios.get("https://discord.com/api/users/@me", {
      headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` }
    });
    const user = responseUser.data;

    // 3️⃣ Pega dados do guild
    const guildMemberResponse = await axios.get(
      `https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`,
      { headers: { Authorization: `Bot ${TOKEN}` } }
    ).catch(() => null);

    if (!guildMemberResponse) return res.status(400).json({ message: "❌ Usuário não encontrado no servidor." });

    const currentRoles = guildMemberResponse.data.roles;
    const newRoles = role ? [...new Set([...currentRoles, role])] : currentRoles;

    if (role) {
      await axios.patch(
        `https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`,
        { roles: newRoles },
        { headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" } }
      ).catch(() => null);
    }

    // 4️⃣ Atualiza usuário no banco
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

    // 5️⃣ Exibe a página de sucesso
    website1(res, guild_id);

    // 6️⃣ Logs via webhook
    if (webhook_logs) {
      const creationDate = new Date((user.id / 4194304 + 1420070400000));
      const guildResponse = await axios.get(`https://discord.com/api/v9/guilds/${guild_id}`, {
        headers: { Authorization: `Bot ${TOKEN}` }
      });

      const avatarId = user.avatar;
      const userId = user.id;
      const avatarExtension = avatarId?.startsWith("a_") ? "gif" : "png";
      const guildIconId = guildResponse.data.icon;
      const guildIconExt = guildIconId?.startsWith("a_") ? "gif" : "png";

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setAuthor({ name: `${user.username} - Novo Usuário Verificado`, iconURL: `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${avatarExtension}` })
        .setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${avatarExtension}`)
        .addFields({ name: "Usuário", value: `\`@${user.username}\``, inline: true })
        .setFooter({ text: guildResponse.data.name, iconURL: `https://cdn.discordapp.com/icons/${guild_id}/${guildIconId}.${guildIconExt}` })
        .setTimestamp();

      await axios.post(webhook_logs, { content: `<@${user.id}>`, embeds: [embed.toJSON()] }).catch(() => null);
    }

  } catch (err) {
    console.error("Erro no callback:", err);
    return res.status(500).json({ message: "Erro interno no servidor", status: 500 });
  }
});

module.exports = router;
