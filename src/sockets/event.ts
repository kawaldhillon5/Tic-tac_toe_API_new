import { createNewGame } from "../db/functions.js";
import { matchQueue } from "../services/matchQueue.js";
import type { Player } from "../types/game.js";
import type { TypedServer, TypedSocket } from "../types/socket.js"

export const events = (io: TypedServer , socket: TypedSocket)=>{
    const joinQueue = async function(this: TypedSocket){
        const s = this;
        if(matchQueue.length == 0 ){
            matchQueue.push(s);
        } else {
            const opponentSocket = matchQueue.shift();
            if(opponentSocket && opponentSocket.connected){
                const p1: Player = {gamerId: opponentSocket.data.gamerId, mark: "X"}
                const p2: Player = {gamerId: s.data.gamerId, mark: "O"};
                const newGameId: string = await createNewGame(p1, p2);
                opponentSocket.join(newGameId);
                s.join(newGameId);
                io.to(newGameId).emit("game_start", {gameId: newGameId});
            }
        }
    }
    
    socket.on("join_queue", joinQueue);
}