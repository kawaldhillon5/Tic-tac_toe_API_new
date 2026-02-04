import { Socket, Server } from "socket.io";

// 1. Events the CLIENT sends to the SERVER
export interface ClientToServerEvents {
  join_queue: () => void;
  leave_queue: () => void;
  make_move: (data: { gameId: string; index: number }) => void;
}

// 2. Events the SERVER sends to the CLIENT
export interface ServerToClientEvents {
  session: (data: { gamerId: string; }) => void;
  game_start: (data: { gameId: string; opponentName: string; symbol: 'X' | 'O' }) => void;
  game_update: (data: { board: string[]; currentTurn: string }) => void;
  game_over: (data: { winnerId: string | null; winningLine: number[] | null }) => void;
  error: (data: { message: string }) => void;
}

// 3. Data we attach to the socket internally
export interface SocketData {
  gamerId: string;
}

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;