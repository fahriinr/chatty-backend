import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./utils/db";
import authRoutes from "./routes/auth.route";

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(cookieParser());

//ROUTES
app.use("/api/auth", authRoutes);

try {
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server Running on Port: ${PORT}`);
  });
} catch (error) {
  console.error("The server failer to start", error);
  process.exit();
}

connectDB();
