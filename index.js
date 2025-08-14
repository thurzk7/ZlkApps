require("dotenv").config();
const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const express = require("express");
const { initDB } = require("./databases/index"); // função de inicialização do MongoDB
const app = express();

const client = new Client({
  intents: Object.keys(GatewayIntentBits),
  partials: Object.keys(Partials)
});

module.exports = client;
client.slashCommands = new Collection();

// Token do Discord do .env
const TOKEN = process.env.DISCORD_BOT_TOKEN;
client.login(TOKEN);

// Inicializa MongoDB antes de usar dbC/dbP/users
(async () => {
  try {
    await initDB();
    console.log("✅ MongoDB inicializado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao inicializar o MongoDB:", err);
  }
})();

client.on('ready', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);

  try {
    // Atualiza clientid no dbP (dbPrincipios)
    const { dbP } = require("./databases/index");
    await dbP.updateOne(
      { key: "autoSet.clientid" },
      { $set: { value: client.user.id } },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Erro ao atualizar dbP.autoSet.clientid\n`, err);
  }

  // Atualiza clientid a cada 1h
  setInterval(async () => {
    try {
      const { dbP } = require("./databases/index");
      await dbP.updateOne(
        { key: "autoSet.clientid" },
        { $set: { value: client.user.id } },
        { upsert: true }
      );
    } catch (err) {
      console.error("Erro ao atualizar dbP.autoSet.clientid periodicamente\n", err);
    }
  }, 60 * 60 * 1000);
});

// Handlers
const evento = require("./handler/Events");
evento.run(client);
require("./handler/index")(client);

// Captura erros globais
process.on('unhandledRejection', (reason, promise) => {
  console.error("🚫 Erro detectado (unhandledRejection):", reason, promise);
});
process.on('uncaughtException', (error, origin) => {
  console.error("🚫 Erro detectado (uncaughtException):", error, origin);
});

// Rotas
const login = require("./routes/login");
app.use("/", login);

const callback = require("./routes/callback");
app.use("/", callback);

// Inicia servidor Express
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});
