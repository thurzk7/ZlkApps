const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

let dbC, dbP, users, carts;
let initialized = false;

async function initDB() {
    if (initialized) return;
    await client.connect();
    const db = client.db("meuDB"); // nome do seu DB

    dbC = db.collection("configs");
    dbP = db.collection("principios");
    users = db.collection("users");
    carts = db.collection("carts");

    initialized = true;
}

// Funções auxiliares
async function getDbC(key, defaultValue) {
    if (!initialized) await initDB(); // força inicialização se ainda não inicializado
    const doc = await dbC.findOne({ key });
    return doc ? doc.value : defaultValue;
}

async function getDbP(key, defaultValue) {
    if (!initialized) await initDB(); // força inicialização se ainda não inicializado
    const doc = await dbP.findOne({ key });
    return doc ? doc.value : defaultValue;
}

async function updateDbP(key, value) {
    if (!initialized) await initDB();
    return await dbP.updateOne({ key }, { $set: { value } }, { upsert: true });
}

async function updateUsers(filter, data) {
    if (!initialized) await initDB();
    return await users.updateOne(filter, { $set: data }, { upsert: true });
}

module.exports = { initDB, getDbC, getDbP, updateDbP, updateUsers };
