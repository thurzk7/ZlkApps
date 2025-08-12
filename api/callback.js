require('dotenv').config(); // carrega as variáveis do .env

const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIGURAÇÕES DO BOT via variáveis de ambiente =====
const config = {
  token: process.env.token,
  owner: process.env.owner,
  clientid: process.env.clientid,
  guild_id: process.env.guild_id,
  webhook_logs: process.env.webhook_logs,
  role: process.env.role,
  secret: process.env.secret,
  redirect: process.env.redirect // Atenção: no .env, deve ser "redirect=https://zlk-apps.vercel.app"
};

// Validação simples para garantir que configs estão definidas
for (const [key, value] of Object.entries(config)) {
  if (!value) {
    console.warn(`⚠️ Variável de ambiente ${key} não está definida!`);
  }
}

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || "meuBanco";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "users";

let db, usersCollection;

// ===== CONEXÃO COM MONGODB =====
async function connectMongo() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI não está definida nas variáveis de ambiente!");
  }
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  usersCollection = db.collection(COLLECTION_NAME);
  console.log("✅ Conectado ao MongoDB");
}

connectMongo().catch(console.error);

// ===== ROTA DE CALLBACK =====
app.get('/api/callback', async (req, res) => {
  const fetch = (await import('node-fetch')).default;
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código de autorização não encontrado.");
  }

  try {
    // Remove barra final de redirect para evitar "//" no redirect_uri
    const redirectUri = `${config.redirect.replace(/\/$/, '')}/api/callback`;
    console.log("Usando redirect_uri para troca do token:", redirectUri);
    console.log("Código recebido:", code);

    // 1️⃣ Troca o código pelo access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientid,
        client_secret: config.secret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.warn("Falha ao obter token:", tokenData);
      return res.status(400).json(tokenData);
    }

    // 2️⃣ Busca dados do usuário
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();

    // 3️⃣ Salva usuário no MongoDB
    await usersCollection.updateOne(
      { id: userData.id },
      {
        $set: {
          username: userData.username,
          accessToken: tokenData.access_token,   // Corrigido typo aqui
          refreshToken: tokenData.refresh_token,
          email: userData.email || "Não Encontrado",
          verified: userData.verified,
          discriminator: userData.discriminator,
          id: userData.id
        }
      },
      { upsert: true }
    );

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
    console.error("Erro na rota /api/callback:", err);
    res.status(500).send("Erro interno no servidor");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
