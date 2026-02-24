import { getGamebyId, updateGame } from "../db/functions.js";
import type { Player } from "../types/game.js";
import type { TypedServer, TypedSocket } from "../types/socket.js";
import { gameTimer } from "./TimerMap.js"

export const deleteTurnTimer = (gameId:string) =>{
    const timer = gameTimer.get(gameId)?.timer;
    if(timer){
        clearTimeout(timer);
        gameTimer.delete(gameId);
    }
}

export const startTurnTimer = (gameId: string, winner: Player | null, io: TypedServer) : number | null =>{
    deleteTurnTimer(gameId);
    if(!winner) return null;
    const timer = setTimeout( async ()=>{
        try{
            const game = await getGamebyId(gameId);

            if (!game || game.status !== "ongoing") return;

            game.status = "won";
            game.winner = winner;

            await updateGame(game);

            io.to(gameId).emit("game_over", {board:game.board, status: "won", winnerId: winner.gamerId, winningArray: null});
            gameTimer.delete(gameId);
        } catch (err){
            console.error("Timer Error:", err);
        }
    }, 30000);
    const deadline = Date.now() + 30000;
    gameTimer.set(gameId, {timer: timer, timerEndTime:deadline });
    return deadline
}


