import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import type{ TypedServer } from "./types/socket.js";
import { initializeSockets } from "./sockets/index.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "*" }));

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL, 
    methods: ["GET", "POST"]
  }
}) as TypedServer;

initializeSockets(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});