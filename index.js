const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
const usersCollection = "users";

app.get("/", (req, res) => {
    res.send("ScholarStream Server is running!");
});

async function run() {
    try {
        await client.connect();
        const db = client.db(databaseName);

        const Scholarships = db.collection(scholarshipsCollection);
        const Users = db.collection(usersCollection);

        app.get("/scholarships", async (req, res) => {
            try {
                const scholarships = await Scholarships.find({}).toArray();
                res.json(scholarships);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch scholarships" });
            }
        });

        app.get("/scholarships/:id", async (req, res) => {
            try {
                const id = req.params.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid scholarship ID" });
                }

                const result = await Scholarships.findOne({ _id: new ObjectId(id) });

                if (!result) {
                    return res.status(404).json({ error: "Scholarship not found" });
                }

                res.json(result);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch scholarship" });
            }
        });

        app.post("/users", async (req, res) => {
            try {
                const user = req.body;

                const exist = await Users.findOne({ email: user.email });

                if (!exist) {
                    await Users.insertOne(user);
                    return res.send({ success: true, message: "User saved" });
                }

                res.send({ success: true, message: "User already exists" });
            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        console.log("MongoDB connected successfully.");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
run().catch(console.dir);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
