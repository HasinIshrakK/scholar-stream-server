const express = require("express");
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Happy Server!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
