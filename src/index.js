require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
const authRoutes = require("./Routes/authRoute");
const userRoutes = require("./Routes/userRoute");
app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static("src/public"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
