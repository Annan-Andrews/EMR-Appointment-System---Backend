const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // REQUIRED for cookies to work cross-origin
  }),
);

app.use(express.json({ limit: "10kb" })); // limit prevents huge payload attacks
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
  res.json({ success: true, message: "EMR API is running successfully" });
});

// Routes
app.use("/api", require("./routes/index"));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
