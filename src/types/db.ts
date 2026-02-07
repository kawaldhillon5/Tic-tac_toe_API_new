import type { Board, Player } from "./game.js";

export interface UserRow {
  id: string;
  created_at: number;
}

export interface GameRowStringified {
    id: string;
    board: string;          
    player1: string;       
    player2: string;        
    current_turn: string;   
    status: string;
    winner: string | null;  
    created_at: number;     
}

export interface GameRow {
    id: string;             
    board: Board; 
    player1: Player | null;
    player2: Player | null;
    current_turn: string | null;
    status: 'waiting' | 'ongoing' | 'won' | 'draw';
    winner: Player | null;
    created_at: Date;
}