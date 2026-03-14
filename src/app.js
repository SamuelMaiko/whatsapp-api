const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "up" });
});

// API Routes
app.use("/api", apiRoutes);

module.exports = app;
