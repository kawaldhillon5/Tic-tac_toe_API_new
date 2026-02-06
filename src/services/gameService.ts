import type { Board, Player, GameStatus, MoveResult, ValidateMoveResult } from '../types/game.js';

export const checkWinner = (board: Board): GameStatus => {

    // 1. Check Rows
    for (let i = 0; i < 3; i++) {
        const row = board[i];
        if (row && row[0] && row[0] === row[1] && row[0] === row[2]) {
            return { winner: row[0], gameOver: true, gameStatus: 'won', winningArray : [{row:i, col:0},{row:i, col:1},{row:i, col:2}] };
        }
    } 

    // 2. Check Columns
    for (let i = 0; i < 3; i++) {
        const cell0 = board[0]?.[i];
        const cell1 = board[1]?.[i];
        const cell2 = board[2]?.[i];

        if (cell0 && cell0 === cell1 && cell0 === cell2) {
            return { winner: cell0, gameOver: true, gameStatus: 'won', winningArray: [{row:0, col:i},{row:1, col:i},{row:1, col:i}]};
        }
    }

    // 3. Check Diagonals
    const mid = board[1]?.[1];
    if (mid) {
        if (board[0]?.[0] === mid && board[2]?.[2] === mid) {
            return { winner: mid, gameOver: true, gameStatus:"won", winningArray : [{row:0, col:0},{row:1, col:1},{row:2, col:2}] };
        }
        if (board[0]?.[2] === mid && board[2]?.[0] === mid) {
            return { winner: mid, gameOver: true, gameStatus:"won", winningArray : [{row:0, col:2},{row:1, col:1},{row:2, col:0}] };
        }
    }

    // 4. Check Draw
    const isDraw = board.flat().every(cell => cell !== null);
    if (isDraw) {
        return { winner: null, gameOver: true, gameStatus: "draw", winningArray: null };
    }

    // Final Fallback
    return { winner: null, gameOver: false, gameStatus: "ongoing", winningArray: null };
};

export const validateMove = (board:Board, row:number, column: number):ValidateMoveResult=>{
    
    //check if board is valid
    if(!board || board[0]?.length ===0){
        return {isValid: false, error:"Invalid Board"}
    }

    //check for out of board cordinates 
    const boardRowLenght = board.length;
    const boardColumnLenght = board[0]?.length;
    if((boardRowLenght && boardColumnLenght) && (row >= boardRowLenght || column >= boardColumnLenght || row < 0 || column < 0) ){
        return {isValid:false, error:"Coordinates are out of bounds"}
    }
    //check if cell is already occupied
    if(board[row]?.[column] !==null){
        return {isValid:false, error:"Cell is Already occupied"}
    }
    return {isValid:true, error:null}
}

export const makeMove = (board:Board, row:number, column:number, player:Player | null):MoveResult =>{
    if (!player){
        return {board: board, success: false, error: "Player not valid"};
    }
    let newBoard: Board = structuredClone(board);
    const moveValidResult = validateMove(newBoard, row, column)
    if(moveValidResult.isValid){
        let newBoardRow = newBoard[row]
        if(newBoardRow){
            newBoardRow[column] = player.mark
            newBoard[row] = newBoardRow
        }
        return {board:newBoard, success: moveValidResult.isValid, error:null};
    } else {
        return {board:newBoard, success: moveValidResult.isValid, error:moveValidResult.error};
    }
}