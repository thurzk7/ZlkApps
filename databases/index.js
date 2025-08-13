const { MongoClient } = require("mongodb");

// URL do MongoDB (você cria uma conta no Atlas e pega a connection string)
const uri = "mongodb+srv://thurzw_:e3ArHwLV7BaisWpY@cluster0.xhu2n8w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

let dbC, dbP, users, carts;

async function initDB() {
    await client.connect();
    const db = client.db("meuDB"); // nome do seu banco

    // Coleções equivalentes aos JSONs
    dbC = db.collection("configs");
    dbP = db.collection("principios");
    users = db.collection("users");
    carts = db.collection("carts");
}

module.exports = { initDB, dbC, dbP, users, carts };
