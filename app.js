const express = require("express");
const cors = require("cors");

const app = express();

// Whitelist the Vite dev server. Override in production via CORS_ORIGINS (comma-separated).
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools with no Origin header (Postman, curl, server-to-server).
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());

// routes
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/companies");
const certificationRoutes = require("./routes/certifications");
const productRoutes = require("./routes/products");
const laneRoutes = require("./routes/lanes");  

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/companies", companyRoutes);
app.use("/certifications", certificationRoutes);
app.use("/products", productRoutes);
app.use("/lanes", laneRoutes); 

module.exports = app;
