import type { TypedServer, TypedSocket } from "../types/socket.js";
import { findUserById, createNewUserInDB } from "../db/functions.js";
import { events } from "./event.js";

export const initializeSockets = (io: TypedServer) => {
  
  // MIDDLEWARE
  io.use(async (socket: TypedSocket, next) => {
    const gamerId : string = socket.handshake.auth.gamerId;
    
    try {
      let user = null;

      // Try to find existing user if ID provided
      if (gamerId) {
        user = await findUserById(gamerId);
      }

      // 2. If no ID or user not found, create new one
      if (!user) {
        user = await createNewUserInDB();
      }

      //  Attach data to socket
      socket.data.gamerId = user.id;
      next();

    } catch (err) {
      console.error("Socket Auth Error:", err);
      next(new Error("Internal Server Error during Auth"));
    }
  });

  // CONNECTION
  io.on("connection", (socket: TypedSocket) => {
    console.log(`User connected: ${socket.data.gamerId}`);

    // Confirm Identity
    socket.emit("session", {
      gamerId: socket.data.gamerId,
    });

    events(io, socket);

    socket.on("disconnecting", ()=>{
      socket.rooms.forEach(room =>{
        io.to(room).emit("opponent_status",{isActive: false});
      });
    });

    socket.on("disconnect", () => {
      
      console.log(`User disconnected: ${socket.data.gamerId}`);
    });
  });
};