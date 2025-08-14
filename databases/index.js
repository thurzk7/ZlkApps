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
    if (!dbC) throw new Error("Banco de dados (configs) não inicializado");
    const doc = await dbC.findOne({ key });
    return doc ? doc.value : defaultValue;
}

async function getDbP(key, defaultValue) {
    if (!dbP) throw new Error("Banco de dados (principios) não inicializado");
    const doc = await dbP.findOne({ key });
    return doc ? doc.value : defaultValue;
}

module.exports = { initDB, getDbC, getDbP, users, carts };
