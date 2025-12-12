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
const reviewsCollection = "reviews";
const applicationsCollection = "applications";

app.get("/", (req, res) => {
    res.send("ScholarStream Server is running!");
});

async function run() {
    try {
        await client.connect();
        const db = client.db(databaseName);

        const Scholarships = db.collection(scholarshipsCollection);
        const Users = db.collection(usersCollection);
        const Reviews = db.collection(reviewsCollection);
        const Applications = db.collection(applicationsCollection);

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

        app.get("/applications", async (req, res) => {
            try {
                const applications = await Applications.find({}).toArray();
                res.json(applications);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch applications" });
            }
        });

        app.post("/applications", async (req, res) => {
            try {
                const applications = req.body;

                const exist = await Applications.findOne({ email: applications.email });

                if (!exist) {
                    await Applications.insertOne(applications);
                    return res.send({ success: true, message: "Applications added" });
                }

                res.send({ success: true, message: "Applications already added" });
            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        app.get('/reviews', async (req, res) => {

            try {
                const email = req.query.email;
                const query = {}
                if (email) {
                    query.userEmail = email;
                }

                const cursor = Reviews.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: "Server Error" });
            }
        });

        app.get("/reviews/:scholarshipId", async (req, res) => {
            try {
                const { scholarshipId } = req.params;
                const reviews = await Reviews.find({ scholarshipId }).toArray();
                res.json(reviews);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch reviews" });
            }
        });

        app.post("/many", async (req, res) => {
            try {
                const reviews = req.body;
                if (!Array.isArray(reviews) || reviews.length === 0) {
                    return res.status(400).json({ message: "Provide an array of reviews" });
                }

                const insertedReviews = await Reviews.insertMany(reviews);
                res.status(201).json({
                    message: "Reviews inserted successfully",
                    count: insertedReviews.length,
                    data: insertedReviews
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Server error", error: err.message });
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
