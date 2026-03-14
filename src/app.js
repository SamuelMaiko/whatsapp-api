const express = require("express");
const cors = require("cors");
const path = require("path");
const apiRoutes = require("./routes/api");

const app = express();

app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "up" });
});

// API Routes
app.use("/api", apiRoutes);

module.exports = app;
