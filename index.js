const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.rwnir9j.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get("/", (req, res) => {
    res.send("Happy Server!");
});

async function run() {
    try {
        await client.connect();

    } finally {
    }
}
run().catch(console.dir);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
