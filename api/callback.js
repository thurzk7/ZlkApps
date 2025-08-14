//a

require("dotenv").config();

const { EmbedBuilder } = require("discord.js");
const { initDB, getDbC, getDbP, updateUsers } = require("../databases/index"); // troquei para usar updateUsers
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
    // 🔹 Inicializa o banco ANTES de qualquer operação
    await initDB();

    // Pega configs do MongoDB, com fallback para .env
    const clientid = await getDbP("autoSet.clientid", process.env.clientid);
    const guild_id = await getDbP("autoSet.guildid", process.env.guild_id);
    const secret = await getDbP("manualSet.secretBot", process.env.secret);
    const webhook_logs = await getDbP("manualSet.webhook", process.env.webhook_logs) || null;
    const role = await getDbC("roles.verify", null);

    const status = (await getDbC("sistema", true)) ?? true;
    if (!status) return res.status(400).json({ message: "`🔴` Oauth2 está desligado", status: 400 });

    const ip = requestIp.getClientIp(req);
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "📡 | Está faltando query...", status: 400 });

    // Website
    website1(res, guild_id);

    const redirectUri = `${process.env.url_apiHost}/api/callback`;

    const responseToken = await axios.post(
      "https://discord.com/api/oauth2/token",
      `client_id=${clientid}&client_secret=${secret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}&scope=identify`,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const token2 = responseToken.data;

    const responseUser = await axios.get("https://discord.com/api/users/@me", {
      headers: { authorization: `${token2.token_type} ${token2.access_token}` }
    }).catch(() => null);
    if (!responseUser?.data) return;

    const user = responseUser.data;

    const guildMemberResponse = await axios.get(
      `https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`,
      { headers: { Authorization: `Bot ${TOKEN}` } }
    ).catch(() => null);
    if (!guildMemberResponse) return;

    const currentRoles = guildMemberResponse.data.roles;
    const newRoles = [...new Set([...currentRoles, role])];

    if (role) {
      await axios.patch(
        `https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`,
        { roles: newRoles },
        { headers: { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" } }
      ).catch(() => null);
    }

    const creationDate = new Date((user.id / 4194304 + 1420070400000));
    const guildResponse = await axios.get(`https://discord.com/api/v9/guilds/${guild_id}`, {
      headers: { Authorization: `Bot ${TOKEN}` }
    }).catch(console.error);

    const avatarId = user.avatar;
    const userId = user.id;
    const avatarExtension = avatarId?.startsWith("a_") ? "gif" : "png";

    const guildId = guildResponse.data.id;
    const iconId = guildResponse.data.icon;
    const iconExtension = iconId?.startsWith("a_") ? "gif" : "png";

    const altPuede = await getDbC("rastrear.ALT", false);
    const emailPuede = await getDbC("rastrear.EMAIL", false);
    const ipPuede = await getDbC("rastrear.IPUSER", false);

    // Busca usuários no Mongo
    const dataAll = await updateUsers({}, {}); // só para garantir init
    const existingUser = dataAll.find(u => u.ipuser === ip);

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setAuthor({ name: `${user.username} - Novo Usuário Verificado`, iconURL: `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${avatarExtension}` })
      .setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${avatarExtension}`)
      .addFields({ name: "Usuário", value: `\`@${user.username}\``, inline: true })
      .setFooter({ text: guildResponse.data.name, iconURL: `https://cdn.discordapp.com/icons/${guildId}/${iconId}.${iconExtension}` })
      .setTimestamp();

    if (emailPuede) embed.addFields({ name: "Email", value: `\`📨 ${user.email}\``, inline: true });

    if (altPuede) {
      if (existingUser && existingUser._id !== user.id) {
        embed.addFields({ name: "Account Alt", value: `\`🎯 Conta alt detectada!\`\n\`👤 @${user.username} - @${existingUser.username}\`` });
        await axios.delete(`https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`, { headers: { Authorization: `Bot ${TOKEN}` } }).catch(console.error);
      } else {
        embed.addFields({ name: "Account Alt", value: "🔴 Não identificado(a).", inline: true });
      }
    }

    if (ipPuede) embed.addFields({ name: "Ip Info User", value: `||${ip}|| **| [🔗](<https://ipinfo.io/${ip}>)**`, inline: true });

    embed.addFields({ name: "Data de criação", value: `<t:${parseInt(creationDate / 1000)}:R>`, inline: true });

    if (webhook_logs) await axios.post(webhook_logs, { content: `<@${user.id}>`, embeds: [embed.toJSON()] });

    // Salva ou atualiza usuário
    await updateUsers(
      { _id: user.id },
      {
        username: user.username,
        acessToken: token2.access_token,
        refreshToken: token2.refresh_token,
        code,
        email: user.email,
        ipuser: ip
      }
    );

  } catch (err) {
    console.error("Erro no callback:", err);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
});

module.exports = router;



