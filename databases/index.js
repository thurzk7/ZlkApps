const { JsonDatabase } = require("wio.db");

const dbC = new JsonDatabase({ databasePath: "./databases/dbConfigs.json" });
const dbP = new JsonDatabase({ databasePath: "./databases/dbPrincipios.json" });
const users = new JsonDatabase({ databasePath: "./databases/dbUsers.json" });
const carts = new JsonDatabase({ databasePath: "./databases/dbCarts.json" });

module.exports = {
    dbC,
    dbP,
    users,
    carts
}
