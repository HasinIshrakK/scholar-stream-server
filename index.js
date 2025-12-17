const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require('stripe')(process.env.STRIPE);

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

        // scholarships

        app.get("/scholarships", async (req, res) => {
            try {
                const { search, degree, category, country, sort, order } = req.query;

                const query = {};

                if (search) {
                    query.$or = [
                        { scholarshipName: { $regex: search, $options: "i" } },
                        { universityName: { $regex: search, $options: "i" } },
                        { degree: { $regex: search, $options: "i" } }
                    ];
                }

                if (degree) query.degree = degree;
                if (category) query.scholarshipCategory = category;
                if (country) query.universityCountry = country;

                let sortQuery = {};
                if (sort) {
                    const sortOrder = order === "asc" ? 1 : -1;
                    sortQuery[sort] = sortOrder;
                } else {
                    sortQuery.scholarshipPostDate = -1;
                }

                const result = await Scholarships.find(query).sort(sortQuery).toArray();

                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: "Server error" });
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

        app.post("/scholarships", async (req, res) => {
            try {
                const scholarship = req.body;

                await Scholarships.insertOne(scholarship);
                return res.send({ success: true, message: "Scholarships saved" });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        app.patch("/scholarships/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const updatedData = req.body;

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        ...updatedData,
                    },
                };

                const result = await Scholarships.updateOne(filter, updateDoc);

                if (result.matchedCount === 0) {
                    return res.send({ success: false, message: "Scholarship not found" });
                }

                res.send({
                    success: true, message: "Scholarship updated successfully",
                });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        app.delete("/scholarships/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const scholarship = await Scholarships.deleteOne({ _id: new ObjectId(id) });

                if (scholarship.deletedCount === 0) {
                    return res.status(404).send({ success: false, message: "Scholarship not found" });
                }

                res.send({
                    success: true, message: "Scholarship deleted successfully",
                });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // applications

        app.get("/applications", async (req, res) => {
            try {
                const email = req.query.email;
                const query = {}
                if (email) {
                    query.userEmail = email;
                }

                const cursor = Applications.find(query);
                const result = await cursor.toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ message: "Server Error" });
            }
        });

        app.get("/applications/:id", async (req, res) => {
            try {
                const id = req.params.id;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid applications ID" });
                }

                const result = await Applications.findOne({ _id: new ObjectId(id) });

                if (!result) {
                    return res.status(404).json({ error: "Applications not found" });
                }

                res.json(result);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch applications" });
            }
        });

        app.post("/applications", async (req, res) => {
            try {
                const application = req.body;

                const exist = await Applications.findOne({ userEmail: application.userEmail, scholarshipId: application.scholarshipId, });

                if (exist) {
                    return res.send({ success: false, message: "You have already applied for this scholarship", });
                }

                await Applications.insertOne(application);

                res.send({ success: true, message: "Application submitted successfully", });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message, });
            }
        });

        app.patch("/applications/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const updatedData = req.body;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ success: false, message: "Invalid application ID" });
                }

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        ...updatedData,
                        updatedAt: new Date(),
                    },
                };

                const result = await Applications.updateOne(filter, updateDoc);

                if (result.matchedCount === 0) {
                    return res.status(404).send({ success: false, message: "Application not found" });
                }

                res.send({
                    success: true, message: "Application updated successfully",
                });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        app.delete("/applications/:id", async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ success: false, message: "Invalid application ID" });
                }

                const result = await Applications.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).send({ success: false, message: "Application not found" });
                }

                res.send({
                    success: true, message: "Application deleted successfully",
                });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // reviews

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

        app.post("/reviews", async (req, res) => {
            try {
                const reviews = req.body;

                const exist = await Reviews.findOne({ email: reviews.userEmail });

                await Reviews.insertOne(reviews);
                return res.send({ success: true, message: "Reviews added" });

                if (!exist) {
                    await Reviews.insertOne(reviews);
                    return res.send({ success: true, message: "Reviews added" });
                }

                res.send({ success: true, message: "Reviews already added" });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        app.patch("/reviews/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const updatedData = req.body;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ success: false, message: "Invalid review ID" });
                }

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        ...updatedData,
                        updatedAt: new Date(),
                    },
                };

                const result = await Reviews.updateOne(filter, updateDoc);

                if (result.matchedCount === 0) {
                    return res.status(404).send({ success: false, message: "Reviews not found" });
                }

                res.send({
                    success: true, message: "Reviews updated successfully",
                });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        app.delete("/reviews/:id", async (req, res) => {
            try {
                const { id } = req.params;

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ success: false, message: "Invalid review ID" });
                }

                const result = await Reviews.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).send({ success: false, message: "Review not found" });
                }

                res.send({
                    success: true, message: "Review deleted successfully",
                });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // users

        app.get("/users", async (req, res) => {
            try {
                const users = await Users.find({}).toArray();
                res.json(users);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch users" });
            }
        });

        app.get("/users/:email", async (req, res) => {
            const { email } = req.params;

            if (!email) {
                return res.status(400).json({ error: "Email is required" });
            }

            try {
                const user = await Users.findOne({ email });

                if (!user) {
                    return res.status(404).json({ role: "student" });
                }

                res.json({ role: user.role || "student" });
            } catch (err) {
                console.error("Failed to fetch user role:", err);
                res.status(500).json({ error: "Failed to fetch user role" });
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

        app.patch("/users/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const updatedData = req.body;

                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: {
                        ...updatedData,
                        updatedAt: new Date(),
                    },
                };

                const user = await Users.updateOne(filter, updateDoc);

                if (user.matchedCount === 0) {
                    return res.status(404).send({ success: false, message: "User not found" });
                }

                res.send({
                    success: true, message: "User updated successfully",
                });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        app.delete("/users/:id", async (req, res) => {
            try {
                const { id } = req.params;

                const user = await Users.deleteOne({ _id: new ObjectId(id) });

                if (user.deletedCount === 0) {
                    return res.status(404).send({ success: false, message: "User not found" });
                }

                res.send({
                    success: true, message: "User deleted successfully",
                });

            } catch (err) {
                console.error(err);
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // Payment related apis

        app.post('/create-checkout-session', async (req, res) => {
            try {
                const { applicationFees, scholarshipName, userEmail, applicationId } = req.body;

                if (!applicationFees || !scholarshipName || !userEmail || !applicationId) {
                    return res.status(400).json({ error: "Missing required fields" });
                }

                const amount = parseInt(applicationFees) * 100;

                const session = await stripe.checkout.sessions.create({
                    line_items: [
                        {
                            price_data: {
                                currency: 'USD',
                                product_data: { name: scholarshipName },
                                unit_amount: amount,
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    metadata: {
                        applicationId,
                        userEmail,
                    },
                    success_url: `http://localhost:5173/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `http://localhost:5173/dashboard/payment-failed/${applicationId}`,
                });

                res.json({ url: session.url });

            } catch (error) {
                console.error("STRIPE ERROR:", error);
                res.status(400).json({ error: error.message });
            }
        });

        app.patch("/verify-payment/:session_id", async (req, res) => {
            try {
                const { session_id } = req.params;

                if (!session_id)
                    return res.status(400).json({ success: false, error: "Missing session id" });

                const session = await stripe.checkout.sessions.retrieve(session_id);

                if (!session)
                    return res.status(404).json({ success: false, error: "Invalid session" });

                const applicationId = session.metadata.applicationId;

                const application = await Applications.findOne({
                    _id: new ObjectId(applicationId),
                });

                if (!application)
                    return res.status(404).json({ success: false, error: "Application not found" });

                if (session.payment_status !== "paid") {
                    return res.json({ success: false });
                }

                await Applications.updateOne(
                    { _id: new ObjectId(applicationId) },
                    { $set: { paymentStatus: "paid", paidAt: new Date(), stripeSessionId: session.id } }
                );

                res.json({
                    success: true,
                    scholarshipName: application.scholarshipName,
                    universityName: application.universityName,
                    amountPaid: session.amount_total / 100,
                    currency: session.currency,
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: "Server error" });
            }
        });


        console.log("MongoDB connected successfully.");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
run().catch(console.dir);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
