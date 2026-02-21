import { Socket, Server } from "socket.io";
import type { Board, Player } from "./game.js";
import type { GameHistoryRow, Scores } from "./db.js";

// 1. Events the CLIENT sends to the SERVER
export interface ClientToServerEvents {
  join_queue: () => void;
  leave_queue: () => void;
  join_game : (data:{gameId: string}) => void,
  make_move: (data: { gameId: string; row: number, col: number, player: string }) => void;
  game_history: (data: {gamerId:string}) => void;
  get_score : (data:{ opponentId: string}) =>void;
}

// 2. Events the SERVER sends to the CLIENT
export interface ServerToClientEvents {
  session: (data: { gamerId: string; }) => void;
  game_history : (data : {games:GameHistoryRow[]}) => void;
  game_start: (data: { gameId: string; turnDeadline: number | null }) => void;
  game_state: (data: { 
    gameId: string;
    board: Board;
    currentTurn: string | null;
    opponent: Player | null; 
    status: 'waiting' | 'ongoing' | 'won' | 'draw';
    winner: string | null;
    winningArray: {row:number, col: number}[] | null;
    turnDeadline: number | null;
  }) => void;
  game_update: (data: { board: Board; currentTurn: string | null; turnDeadline: number |  null; }) => void;
  game_over: (data: {board: Board, status: 'won' | 'draw', winnerId: string | null; winningArray: {row:number, col: number}[] | null }) => void;
  timer_start : () => void;
  score_data : (data: Scores) => void
  error: (data: { message: string }) => void;
}

// 3. Data we attach to the socket internally
export interface SocketData {
  gamerId: string;
}

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;