
export type Player = {
    username: string, 
    mark: 'X' | 'O'
};

export type Cell = 'X' | 'O' | null;

export type Board = Cell[][];

export interface GameStatus {
    winner: 'X' | 'O' | null;
    gameOver: boolean;
    gameStatus: 'ongoing' | 'won' | 'draw'
}

export interface ValidateMoveResult {
    isValid: boolean;
    error: string | null
}

export interface MoveResult {
    board: Board;
    success: boolean;
    error: string | null;
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