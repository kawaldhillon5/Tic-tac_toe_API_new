import type { Board, Player } from "./game.js";

export interface UserRow {
  id: string;
  created_at: number;
}

export interface GameRow {
    id: string;             
    board: Board; 
    player1: Player | null;
    player2: Player | null;
    current_turn: Player | null;
    status: 'waiting' | 'ongoing' | 'won' | 'draw';
    winner: Player | null;
    created_at: Date;
}