require("dotenv").config();

const { EmbedBuilder } = require("discord.js");
const { dbC, dbP, users, getDbC, getDbP } = require("../databases/index");
const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const requestIp = require("request-ip");
const axios = require("axios");
const { website1 } = require("../functions/website1");

// Token do Discord do .env
const TOKEN = process.env.DISCORD_BOT_TOKEN;

router.get("/api/callback", async (req, res) => {
    // Garante que o banco está inicializado
    if (!dbC || !dbP || !users) {
        return res.status(500).json({ message: "Banco de dados não inicializado ainda" });
    }

    // Pega configs do MongoDB
    const clientid = await getDbP("autoSet.clientid", "");
    const guild_id = await getDbP("autoSet.guildid", "");
    const secret = await getDbP("manualSet.secretBot", "");
    const webhook_logs = await getDbP("manualSet.webhook", null);
    const role = await getDbC("roles.verify", null);

    const status = (await getDbC("sistema", true)) ?? true;
    if (!status) return res.status(400).json({ message: "`🔴` Oauth2 está desligado", status: 400 });

    const ip = requestIp.getClientIp(req);
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "📡 | Está faltando query...", status: 400 });

    // Exibe o website
    website1(res, guild_id);

    // Pega token do Discord
    const responseToken = await axios.post(
        "https://discord.com/api/oauth2/token",
        `client_id=${clientid}&client_secret=${secret}&code=${code}&grant_type=authorization_code&redirect_uri=${process.env.URL_APIHOST}/api/callback&scope=identify`,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const token2 = responseToken.data;

    // Pega dados do usuário
    const responseUser = await axios.get("https://discord.com/api/users/@me", {
        headers: { authorization: `${token2.token_type} ${token2.access_token}` }
    }).catch(() => null);
    if (!responseUser?.data) return;

    const user = responseUser.data;

    // Pega membro do servidor
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

    // Datas e IDs
    const creationDate = new Date((user.id / 4194304 + 1420070400000));
    const guildResponse = await axios.get(`https://discord.com/api/v9/guilds/${guild_id}`, { headers: { Authorization: `Bot ${TOKEN}` } }).catch(console.error);

    const avatarId = user.avatar;
    const userId = user.id;
    const avatarExtension = avatarId?.startsWith("a_") ? "gif" : "png";

    const guildId = guildResponse.data.id;
    const iconId = guildResponse.data.icon;
    const iconExtension = iconId?.startsWith("a_") ? "gif" : "png";

    // Configurações de rastreio
    const altPuede = await getDbC("rastrear.ALT", false);
    const emailPuede = await getDbC("rastrear.EMAIL", false);
    const ipPuede = await getDbC("rastrear.IPUSER", false);

    // Usuário existente pelo IP
    const dataAll = await users.find({}).toArray();
    const existingUser = dataAll.find(u => u.ipuser === ip);

    // Cria embed
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

    // Salva ou atualiza usuário no MongoDB
    await users.updateOne(
        { _id: user.id },
        { $set: {
            username: user.username,
            acessToken: token2.access_token,
            refreshToken: token2.refresh_token,
            code,
            email: user.email,
            ipuser: ip
        }},
        { upsert: true }
    );
});

module.exports = router;
