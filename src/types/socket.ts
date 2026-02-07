import { Socket, Server } from "socket.io";
import type { Board, Player } from "./game.js";

// 1. Events the CLIENT sends to the SERVER
export interface ClientToServerEvents {
  join_queue: () => void;
  leave_queue: () => void;
  make_move: (data: { gameId: string; row: number, col: number, player: string }) => void;
}

// 2. Events the SERVER sends to the CLIENT
export interface ServerToClientEvents {
  session: (data: { gamerId: string; }) => void;
  queue_joined: (data: {gameId:string})=>void;
  game_start: (data: { gameId: string; }) => void;
  game_update: (data: { board: Board; currentTurn: string | null }) => void;
  game_over: (data: { winnerId: string | null;     winningArray: {row:number, col: number}[] | null }) => void;
  error: (data: { message: string }) => void;
}

// 3. Data we attach to the socket internally
export interface SocketData {
  gamerId: string;
}

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;