const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);

let dbC, dbP, users, carts;

async function initDB() {
    await client.connect();
    const db = client.db("meuDB"); // nome do seu DB

    dbC = db.collection("configs");
    dbP = db.collection("principios");
    users = db.collection("users");
    carts = db.collection("carts");
}

// Funções auxiliares para substituir .get()
async function getDbC(key, defaultValue) {
    const doc = await dbC.findOne({ key });
    return doc ? doc.value : defaultValue;
}

async function getDbP(key, defaultValue) {
    const doc = await dbP.findOne({ key });
    return doc ? doc.value : defaultValue;
}

module.exports = { initDB, dbC, dbP, users, carts, getDbC, getDbP };
