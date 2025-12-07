const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

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
    },
});

const databaseName = "ScholarStreamDB";
const scholarshipsCollection = "scholarships";

app.get("/", (req, res) => {
    res.send("ScholarStream Server is running!");
});



async function run() {
    try {
        await client.connect();

        const db = client.db(databaseName);
        await db.createCollection(scholarshipsCollection);

        app.get("/scholarships", async (req, res) => {
            try {
                const db = client.db(databaseName);
                const scholarships = await db.collection(scholarshipsCollection).find({}).toArray();
                res.json(scholarships);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch scholarships" });
            }
        });

        console.log("Connected to MongoDB successfully.");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
run().catch(console.dir);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

