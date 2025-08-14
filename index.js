require("dotenv").config();
const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const express = require("express");
const { initDB, users, getDbP } = require("./databases/index"); // pegar getDbP ao invés de dbP
const app = express();

const client = new Client({
  intents: Object.keys(GatewayIntentBits),
  partials: Object.keys(Partials)
});

module.exports = client;
client.slashCommands = new Collection();

// Token do Discord
const TOKEN = process.env.DISCORD_BOT_TOKEN;
client.login(TOKEN);

(async () => {
  try {
    // Inicializa MongoDB
    await initDB();
    console.log("✅ MongoDB inicializado com sucesso!");

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

  } catch (err) {
    console.error("❌ Erro ao inicializar o MongoDB ou servidor:", err);
  }
})();

client.on('ready', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);

  try {
    // Atualiza clientid usando getDbP e users/upsert (ou criar função update no DB)
    await getDbP("autoSet.clientid", ""); // só para garantir que está inicializado
    const db = require("./databases/index"); // pega o module novamente
    await db.users.updateOne(
      { key: "autoSet.clientid" },
      { $set: { value: client.user.id } },
      { upsert: true }
    );
  } catch (err) {
    console.error("Erro ao atualizar dbP.autoSet.clientid\n", err);
  }

  // Atualiza clientid a cada 1h
  setInterval(async () => {
    try {
      const db = require("./databases/index");
      await db.users.updateOne(
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
