const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { dbC, dbP, users } = require("../databases/index");
const { token, url_apiHost } = require("../config.json");
const { website1 } = require("../functions/website1");
const { Router } = require("express");
const router = Router();
const discordOauth = require("discord-oauth2");
const oauth = new discordOauth();
const requestIp = require("request-ip");
const moment = require("moment");
const axios = require("axios");
const uaParser = require('ua-parser-js');

router.get("/api/callback", async (req, res) => {

    const clientid = await dbP.get("autoSet.clientid");
    const guild_id = await dbP.get("autoSet.guildid");
    const secret = await dbP.get("manualSet.secretBot");
    const webhook_logs = await dbP.get("manualSet.webhook");
    const role = await dbC.get("roles.verify");

    const status = dbC.get("sistema") === null ? true : dbC.get("sistema");
            
    if (!status) {
        return res.status(400).json({ message: "\`🔴\` Oauth2 esta desligado", status: 400 });
    }

    const ip = requestIp.getClientIp(req);
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({ message: "📡 | Está faltando query...", status: 400 });
    };

    website1(res, guild_id);
    const responseToken = await axios.post(
        'https://discord.com/api/oauth2/token',
        `client_id=${clientid}&client_secret=${secret}&code=${code}&grant_type=authorization_code&redirect_uri=${url_apiHost}/api/callback&scope=identify`,
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    const token2 = responseToken.data;
    const responseUser = await axios.get('https://discord.com/api/users/@me', {
        headers: {
            authorization: `${token2.token_type} ${token2.access_token}`,
        },
    }).catch(() => { });
    const user = responseUser.data;
    const guildMemberResponse = await axios.get(`https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`, {
        headers: {
            'Authorization': `Bot ${token}`
        }
    }).catch(() => { });

    if (!guildMemberResponse) return;
    const currentRoles = guildMemberResponse.data.roles;
    const newRoles = [...new Set([...currentRoles, role])];
    const guildUrl = `https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`;
    const headers = {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
    };

    if (role) {
        axios.patch(guildUrl, { roles: newRoles }, { headers }).catch(() => { });
    };

    const creationDate = new Date((user.id / 4194304 + 1420070400000));

    const guildResponse = await axios.get(`https://discord.com/api/v9/guilds/${guild_id}`, {
        headers: {
            'Authorization': `Bot ${token}`
        }
    }).catch(err => {
        console.error(err);
    });

    const avatarId = user.avatar;
    const userId = user.id;

    const avatarExtension = avatarId.startsWith('a_') ? 'gif' : 'png';

    const guildId = guildResponse.data.id;
    const iconId = guildResponse.data.icon;

    const iconExtension = iconId.startsWith('a_') ? 'gif' : 'png';

    const altPuede = await dbC.get("rastrear.ALT");
    const emailPuede = await dbC.get("rastrear.EMAIL");
    const ipPuede = await dbC.get("rastrear.IPUSER");

    const dataAll = users.all();
    const existingUser = Object.values(dataAll).find(user => user.data.ipuser === ip);

    const embed = new EmbedBuilder()
        .setColor(`#00FF00`)
        .setAuthor({ name: `${user.username} - Novo Usuário Verificado`, iconURL: `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${avatarExtension}` })
        .setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${avatarExtension}`)
        .addFields(
            { name: "Usuário", value: `\`@${user.username}\``, inline: true }
        )
        .setFooter({ text: `${guildResponse.data.name}`, iconURL: `https://cdn.discordapp.com/icons/${guildId}/${iconId}.${iconExtension}` })
        .setTimestamp();

    if (emailPuede) {
        embed.addFields(
            { name: `Email`, value: `\`📨 ${user.email}\``, inline: true }
        );
    };

    if (altPuede) {
        if (existingUser) {
            if (existingUser.ID !== user.id) {
                if (existingUser) {
                    embed.addFields(
                        { name: `Account Alt`, value: `\`🎯 Conta alt detectada!\`\n\`👤 @${user.username} - @${existingUser.data.username}\`` }
                    );

                    await axios.delete(`https://discord.com/api/v9/guilds/${guild_id}/members/${user.id}`, {
                        headers: {
                            'Authorization': `Bot ${token}`
                        }
                    }).catch(err => {
                        console.error("🔴 Erro ao expulsar membro:", err);
                    });
                };
            } else {
                embed.addFields(
                    { name: `Account Alt`, value: `\`🔴 Não idênticado(a).\``, inline: true }
                );
            };
        } else {
            embed.addFields(
                { name: `Account Alt`, value: `\`🔴 Não idênticado(a).\``, inline: true }
            );
        }
    };

    if (ipPuede) {
        embed.addFields(
            { name: "Ip Info User", value: `||${ip}|| **| [🔗](<https://ipinfo.io/${ip}>)**`, inline: true },
        );
    };

    embed.addFields(
        { name: `Data de criação`, value: `<t:${parseInt(creationDate / 1000)}:R>`, inline: true }
    );

    if (webhook_logs) {
        await axios.post(webhook_logs, { content: `<@${user.id}>`, embeds: [embed.toJSON()] });
    };

    await users.set(`${user.id}`, {
        username: user.username,
        acessToken: token2.access_token,
        refreshToken: token2.refresh_token,
        code,
        email: user.email,
        ipuser: ip
    });

});

module.exports = router;
