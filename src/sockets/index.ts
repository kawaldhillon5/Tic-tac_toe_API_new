import type { TypedServer, TypedSocket } from "../types/socket.js";
import { GetUsername } from "../utils/idGenerator.js";
import { events } from "./event.js";

export const initializeSockets = (io: TypedServer) => {
  
  // MIDDLEWARE
  io.use(async (socket: TypedSocket, next) => {
    const gamerId : string = socket.handshake.auth.gamerId;
    
    try {

      if (!gamerId) {
        socket.data.gamerId = GetUsername();
      } else {
        socket.data.gamerId = gamerId;
      }

      

      socket.data.re_match_req = false;
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