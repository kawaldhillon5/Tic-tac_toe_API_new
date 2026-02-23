import { createNewGame, getGamebyId, getGamesByUser, getSessionScore, updateGame } from "../db/functions.js";
import { checkWinner, makeMove } from "../services/gameService.js";
import { matchQueue } from "../services/matchQueue.js";
import { gameTimer } from "../services/TimerMap.js";
import { deleteTurnTimer, startTurnTimer } from "../services/TimerService.js";
import type { GameHistoryRow, GameRow, Scores } from "../types/db.js";
import type { GameStatus, Player } from "../types/game.js";
import type { TypedServer, TypedSocket } from "../types/socket.js"

export const events = (io: TypedServer , socket: TypedSocket)=>{

    const joinQueue = async ()=>{
        try{
            if(matchQueue.length == 0 ){
                socket.data.re_match_req = false;
                const userGames = await getGamesByUser(socket.data.gamerId);
                userGames.forEach((game)=>{
                    if(game.status === "ongoing"){
                        const timer  =  gameTimer.get(game.id);
                        const deadline = timer ? timer.timerEndTime : null
                        socket.emit("game_start", {gameId: game.id, turnDeadline: deadline});
                        return;
                    }
                });
                matchQueue.push(socket);
            } else {
                const opponentSocket = matchQueue.shift();
                if(opponentSocket && opponentSocket.connected){
                    if(opponentSocket.id === socket.id) throw new Error("Socket Already in Queue!")
                    const p1: Player = {gamerId: opponentSocket.data.gamerId, mark: "X"}
                    const p2: Player = {gamerId: socket.data.gamerId, mark: "O"};
                    const newGameId: string = await createNewGame(p1, p2);
                    opponentSocket.join(newGameId);
                    socket.join(newGameId);
                    const deadline = startTurnTimer(newGameId,p2,io);
                    io.to(newGameId).emit("game_start", {gameId: newGameId, turnDeadline: deadline});
                    matchQueue.splice(0, matchQueue.length);
                } else {
                    matchQueue.push(socket);
                }
            }
        } catch (err: any){
            console.log(err);
            socket.emit("error", { message: err.message || "Error Joining Queue"});
        }
    }

    const leaveQueue = ()=>{
            const socketIndex  = matchQueue.findIndex((s)=>{
                return s.data.gamerId == socket.data.gamerId;
            });
            if(socketIndex != -1){
                matchQueue.splice(socketIndex,1);
            }
    }

    const handleReMatch = async (data: {gameId: string, opponentId: string}, opponentSocket: any)=>{
        try{
            const gameWinner =  (await getGamebyId(data.gameId)).winner;
            if(!opponentSocket) throw new Error("Opponent Not Avaliable");
            const p1: Player = {gamerId: gameWinner ? gameWinner.gamerId === socket.data.gamerId ? socket.data.gamerId: opponentSocket.data.gamerId : socket.data.gamerId,  mark:"X"};
            const p2: Player = {gamerId: p1.gamerId === socket.data.gamerId ? opponentSocket.data.gamerId : socket.data.gamerId, mark: "O"};
            const newGameId: string = await createNewGame(p1, p2);

            //leave old room
            socket.leave(data.gameId);
            opponentSocket.leave(data.gameId);

            // join new room

            opponentSocket.join(newGameId);
            socket.join(newGameId);
            socket.data.re_match_req = false;
            opponentSocket.data.re_match_req = false;
            const deadline = startTurnTimer(newGameId,p2,io);
            io.to(newGameId).emit("game_start", {gameId: newGameId, turnDeadline: deadline});

        } catch (err : any){
            console.log(err)
            socket.emit("error",{message: err.message || "Error Creating new Game"});
        }

    }

    const handleReMatchReq = async (data: {gameId: string, opponentId: string})=>{
        if(!data.gameId) return;
        socket.emit("re_match_req_sent");
        socket.data.re_match_req = true;
        const opponentSocket = (await io.to(data.gameId).fetchSockets()).filter((socket)=>{
                if(socket.data.gamerId === data.opponentId)
                    return socket;
            })[0];
        if(opponentSocket?.data.re_match_req){
            handleReMatch(data, opponentSocket);
        }
    }


    const joinGame = async (data: { gameId: string }) => {
        const { gameId } = data;
        const userId = socket.data.gamerId;

        try {
            const game = await getGamebyId(gameId);
            if (!game) {
                socket.emit("error", { message: "Game not found" });
                return;
            }

            
            const p1 = game.player1; 
            const p2 = game.player2; 

            const isP1 = p1?.gamerId === userId;
            const isP2 = p2?.gamerId === userId;

            if (!isP1 && !isP2) {
                socket.emit("error", { message: "You are not a player in this game" });
                return;
            }

            const opponent = isP1 ? p2 : p1;

            socket.join(gameId);

            const timerData = gameTimer.get(gameId);

            socket.emit("game_state", {
                gameId: game.id,
                board: game.board,
                currentTurn: game.current_turn,
                opponent: opponent,
                status: game.status,
                winner: game.winner?.gamerId || null,
                winningArray: checkWinner(game.board).winningArray,
                turnDeadline: timerData ? timerData.timerEndTime : null,
            });
            socket.to(gameId).emit("opponent_status",{isActive:true});

        } catch (err) {
            console.error(err);
            socket.emit("error", { message: "Failed to sync game" });
        }
    };

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

            if(game.status !== "ongoing"){
                socket.emit("error", {message: "Game Over! Cannot Register Move"});
                return;
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

            if(gameCheckResult.gameOver === false){
                let newCurrentTurn = game.player1?.gamerId === data.player ? game.player2?.gamerId : game.player1?.gamerId;  
                game.current_turn = newCurrentTurn == undefined ? null : newCurrentTurn;
                const moveDeadline = startTurnTimer(game.id, currentTurnPlayer, io );
                io.to(game.id).emit("game_update",{board: game.board, currentTurn: game.current_turn, turnDeadline: moveDeadline });
            } else {
                deleteTurnTimer(game.id);
                const winner = game.winner?.gamerId == undefined ? null :game.winner?.gamerId;
                io.to(game.id).emit("game_over",{board: game.board ,status: game.status == "won" ? "won" : "draw" ,winnerId: winner, winningArray: gameCheckResult.winningArray});
            } 
            await updateGame(game);
            return
        } catch (err: any){
            console.log(err);
            socket.emit("error", { message: err.message || "Error Registering Move"});
        }
    }

    const handleGetUserHistory = async (data :{gamerId : string}) =>{
        if(!data.gamerId) socket.emit("error",{message:"GamerId not Valid"});
        try{
            const gamesStringified = await getGamesByUser(data.gamerId);
            const games : GameHistoryRow[] = gamesStringified.map((game) : GameHistoryRow =>{
                return {
                    id:game.id,
                    player1: JSON.parse(game.player1),
                    player2: JSON.parse(game.player2),
                    status: game.status,
                    winner: game.winner ? JSON.parse(game.winner) : null,
                    created_at: game.created_at
                }
            });
            socket.emit("game_history",{games: games});

        }catch(err : any){
            console.log(err);
            socket.emit("error",{message:"Could Not Get Games History"});
            
        }
    }

    const handleGetScore = async(data:{opponentId: string}) =>{
        if(!data.opponentId) socket.emit("error",{message:"Invalid Opponent Id"});
        try{
            
            const myId = socket.data.gamerId;
            const scores: Scores = await getSessionScore(myId, data.opponentId);
            socket.emit("score_data", scores);
                
            
            }catch (err: any){
                console.log(err);
                socket.emit("error",{message:"Could Not Get Scores"});
            }
    }

    socket.on("join_queue", joinQueue);
    socket.on("leave_queue", leaveQueue);
    socket.on("join_game", joinGame);
    socket.on("game_history", handleGetUserHistory);
    socket.on("get_score", handleGetScore);
    socket.on("re_match_request", handleReMatchReq);
    socket.on("make_move", (data: { gameId: string; row: number, col: number, player: string }) => handleMove(data))
}