const { MongoClient } = require("mongodb");
require("dotenv").config(); // Carrega .env

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let dbC, dbP, users, carts;

async function initDB() {
    await client.connect();
    const db = client.db("meuDB"); // nome do seu DB

    dbC = db.collection("configs");
    dbP = db.collection("principios");
    users = db.collection("users");
    carts = db.collection("carts");
}

async function getConfig(key, defaultValue) {
    const doc = await dbC.findOne({ key });
    return doc ? doc.value : defaultValue;
}

module.exports = { initDB, dbC, dbP, users, carts, getConfig };
