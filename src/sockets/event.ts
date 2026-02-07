import { createNewGame, getGamebyId, updateGame } from "../db/functions.js";
import { checkWinner, makeMove } from "../services/gameService.js";
import { matchQueue } from "../services/matchQueue.js";
import type { GameRow } from "../types/db.js";
import type { GameStatus, Player } from "../types/game.js";
import type { TypedServer, TypedSocket } from "../types/socket.js"

export const events = (io: TypedServer , socket: TypedSocket)=>{
    const joinQueue = async ()=>{
        try{
            if(matchQueue.length == 0 ){
            matchQueue.push(socket);
            } else {
                const opponentSocket = matchQueue.shift();
                if(opponentSocket && opponentSocket.connected){
                    const p1: Player = {gamerId: opponentSocket.data.gamerId, mark: "X"}
                    const p2: Player = {gamerId: socket.data.gamerId, mark: "O"};
                    const newGameId: string = await createNewGame(p1, p2);
                    opponentSocket.join(newGameId);
                    socket.join(newGameId);
                    io.to(newGameId).emit("game_start", {gameId: newGameId});
                } else {
                    matchQueue.push(socket);
                }
            }
        } catch (err: any){
            console.log(err);
            socket.emit("error", { message: err.message || "Error Joining Queue"});
        }
        
    }

    const handleMove = async (data: { gameId: string; row: number, col: number, player: string }) =>{
        try{
            const game = await getGamebyId(data.gameId);
            if(!game) {
                socket.emit("error",{message: "Could Not Find Game"});
                return;
            }
            
            if(game.current_turn != data.player) {
                socket.emit("error", {message: "Not Your Turn!"});
                return
            }

            const currentTurnPlayer = game.current_turn == game.player1?.gamerId ? game.player1 : game.player2; 
            const validateMove = makeMove(game.board, data.row, data.col, currentTurnPlayer);
            if(!validateMove.success) {
                socket.emit("error", {message: validateMove.error || " Could Not Register Move"});
                return
            }

            game.board = validateMove.board;

            const gameCheckResult: GameStatus = checkWinner(game.board);

            game.status = gameCheckResult.gameStatus;
            game.winner = gameCheckResult.winner  === game.player1?.mark ?  game.player1 : gameCheckResult.winner  === game.player2?.mark ?  game.player2 : null;

            game.winner = game.player1?.mark === gameCheckResult.winner ? game.player1 : game.player2;

            if(gameCheckResult.gameOver === false){
                let newCurrentTurn = game.player1?.gamerId === data.player ? game.player2?.gamerId : game.player1?.gamerId;  
                game.current_turn = newCurrentTurn == undefined ? null : newCurrentTurn; 
            } else {
                const winner = game.winner?.gamerId == undefined ? null :game.winner?.gamerId;
                io.to(game.id).emit("game_over",{winnerId: winner, winningArray: gameCheckResult.winningArray});
                return;
            } 

            const updatedGame = await updateGame(game);
            io.to(updatedGame.id).emit("game_update",{board: updatedGame.board, currentTurn: updatedGame.current_turn })
            
            return

        } catch (err: any){
            console.log(err);
            socket.emit("error", { message: err.message || "Error Registering Move"});
        }
    }
    
    socket.on("join_queue", joinQueue);
    socket.on("make_move", (data: { gameId: string; row: number, col: number, player: string }) => handleMove(data))
}