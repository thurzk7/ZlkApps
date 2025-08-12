const express = require('express');
const app = express();
const PORT = 3000;
const { JsonDatabase } = require('wio.db'); // importa banco
const users = new JsonDatabase({ databasePath: './src/DataBaseJson/users.json' });

// Configurações do seu bot
const config = {
  token: "MTQwMTM5Mjk4NDAwNzkwMTMwNA.GZ9IzT.bl460VNVCPOrJBhpnCPbKGz5MAyLKq8vypa8nk",
  owner: "1218965011527897149",
  clientid: "1401392984007901304",
  guild_id: "1230888692005081098",
  webhook_logs: "https://discord.com/api/webhooks/1404593496077111427/u1ABJYRhgAXRcNwRF2my45LzEdNuWFpRTKQt8mMv0PPRaWoMbVn1BRQMXlnCIankX3DWT",
  role: "1386891219967410318",
  secret: "z4LlBCIr1SW5rDGPChpu2viuuMuCv7iF",
  redirect: "https://zlk-apps.vercel.app"
};

// Rota de callback
app.get('/api/callback', async (req, res) => {
  // Importa node-fetch dinamicamente dentro da função async
  const fetch = (await import('node-fetch')).default;

  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código de autorização não encontrado.");
  }

  try {
    // 1️⃣ Troca o código pelo access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientid,
        client_secret: config.secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${config.redirect}/api/callback`
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(400).json(tokenData);
    }

    // 2️⃣ Busca dados do usuário
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();

    // 3️⃣ Salva usuário no banco incluindo verified
    await users.set(`${userData.id}`, {
      username: userData.username,
      acessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      email: userData.email || "Não Encontrado",
      verified: userData.verified,  // <-- Aqui o campo verificado
      discriminator: userData.discriminator,
      id: userData.id
    });

    // 4️⃣ Adiciona o usuário à guilda
    await fetch(`https://discord.com/api/guilds/${config.guild_id}/members/${userData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${config.token}`
      },
      body: JSON.stringify({
        access_token: tokenData.access_token,
        roles: [config.role]
      })
    });

    // 5️⃣ Redireciona para o site
    res.redirect(config.redirect);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro interno no servidor");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
