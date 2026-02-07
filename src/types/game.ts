
export type Player = {
    gamerId: string, 
    mark: 'X' | 'O'
};

export type Cell = 'X' | 'O' | null;

export type Board = Cell[][];

export interface GameStatus {
    winner: 'X' | 'O' | null;
    gameOver: boolean;
    gameStatus: 'ongoing' | 'won' | 'draw'
    winningArray: {row:number, col: number}[] | null
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

