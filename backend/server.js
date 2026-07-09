require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { testConnection } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const donorRoutes = require("./routes/donor.routes");
const recipientRoutes = require("./routes/recipient.routes");
const hospitalRoutes = require("./routes/hospital.routes");
const bloodBankRoutes = require("./routes/bloodbank.routes");
const bloodRequestRoutes = require("./routes/bloodRequest.routes");
const organRequestRoutes = require("./routes/organRequest.routes");
const matchingRoutes = require("./routes/matching.routes");
const notificationRoutes = require("./routes/notification.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const reportRoutes = require("./routes/report.routes");
const adminRoutes = require("./routes/admin.routes");
const profileRoutes = require("./routes/profile.routes");
const searchRoutes = require("./routes/search.routes");

const app = express();

/* -----------------------------------
   Security Middleware
------------------------------------ */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* -----------------------------------
   CORS Configuration
------------------------------------ */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (Render health checks, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* -----------------------------------
   General Middleware
------------------------------------ */

app.use(compression());

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* -----------------------------------
   Rate Limiting
------------------------------------ */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

/* -----------------------------------
   Health Check
------------------------------------ */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LifeLink Backend Running",
    environment: process.env.NODE_ENV,
    timestamp: new Date(),
  });
});

/* -----------------------------------
   API Routes
------------------------------------ */

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/bloodbanks", bloodBankRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);
app.use("/api/organ-requests", organRequestRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/search", searchRoutes);

/* -----------------------------------
   Error Handling
------------------------------------ */

app.use(notFound);
app.use(errorHandler);

/* -----------------------------------
   Start Server
------------------------------------ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  await testConnection();
});

module.exports = app;