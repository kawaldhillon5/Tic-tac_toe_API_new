import db from "./index.js";
import { GetUsername } from "../utils/idGenerator.js";
import type { GameHistoryStringified, GameRow, GameRowStringified, Scores, UserRow } from "../types/db.js";
import type { Board, Player } from "../types/game.js";
import { v4 as uuidv4 } from 'uuid';

// 1. Find a user by ID
export const findUserById = (id: string): Promise<UserRow | null> => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row: UserRow) => {
      if (err) {
        console.error("DB Error findUserById:", err);
        return reject(err);
      }
      resolve(row || null);
    });
  });
};

// 2. Create a new user
export const createNewUserInDB = (): Promise<UserRow> => {
  return new Promise((resolve, reject) => {
    const newId = GetUsername();
    const now = Date.now();

    db.run(
      "INSERT INTO users (id, created_at) VALUES (?, ?)",
      [newId, now],
      (err) => {
        if (err) {
          console.error("DB Error createNewUserInDB:", err);
          return reject(err);
        }
        resolve({
          id: newId,
          created_at: now
        });
      }
    );
  });
};

// create a new game
export const createNewGame = (p1: Player, p2: Player) : Promise<string> =>{
  return new Promise((resolve, reject) =>{
    const id  = uuidv4();
    const board: Board = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
    ];

    db.run(
      "INSERT INTO games (id, board, player1, player2, current_turn, status, created_at ) VALUES (?, ?, ?, ?, ?, ? , ? )",
      [
        id,
        JSON.stringify(board),
        JSON.stringify(p1),
        JSON.stringify(p2),
        p1.gamerId,
        'ongoing',
        JSON.stringify(Date.now())
      ],(err)=>{
        if(err){
          console.error("DB Error createNewUserInDB:", err);
          return reject(err);
        }
        resolve(
          id.toString()
        )
      }
    )
  });
};

// get game using id
export const getGamebyId = (gameId: string): Promise<GameRow> =>{
  return new Promise((resolve, reject) =>{

    db.get("SELECT * FROM games WHERE id = ? ",[gameId],(err, row: GameRowStringified)=>{
      if(err){
        console.error("DB Error findGameById:", err);
        return reject(err);
      }
      try {
        const game: GameRow = {
            id: row.id,
            board: JSON.parse(row.board),
            player1: JSON.parse(row.player1),
            player2: JSON.parse(row.player2),
            current_turn: row.current_turn, 
            status: row.status as any, 
            winner: row.winner ? JSON.parse(row.winner) : null,
            created_at: new Date(row.created_at)
        };

        resolve(game);

      } catch (parseError) {
        console.error("Failed to parse game data:", parseError);
        reject(new Error("Corrupt Game Data"));
      }
    });
  });
};

export const updateGame = (gameRow: GameRow):  Promise<GameRow> =>{
  return new Promise((resolve, reject) =>{
    db.run("UPDATE games SET board = ?, current_turn = ?, status = ?, winner = ? Where id = ?", [JSON.stringify(gameRow.board), gameRow.current_turn, gameRow.status, JSON.stringify(gameRow.winner), gameRow.id], function(err){
      if(err){
        console.error("DB Error upateGame:", err);
        return reject(err);
      }
      if( !this.changes){
        return reject(new Error("Could Not Find Game to Update"));
      }
      resolve(gameRow);
    });
  });
};

export const getGamesByUser = (gamerId: string) : Promise<GameHistoryStringified[]> =>{
  return new Promise((resolve, reject) =>{
    db.all("SELECT id, player1, player2, status, winner, created_at FROM games WHERE NOT status = 'waiting'  AND (player1 LIKE ? OR player2 LIKE ?) ORDER BY created_at DESC LIMIT 10 ;",[`%${gamerId}%`,`%${gamerId}%`],(err: any, rows : [])=>{
      if(err){
        console.error("DB Error getGamesByUser: ", err);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

export const getSessionScore = (myId: string, opponentId: string): Promise<Scores> => {
  return new Promise((resolve, reject) => {
   
    const query = `
      SELECT 
        SUM(CASE WHEN winner LIKE ? THEN 1 ELSE 0 END) as myWins,
        SUM(CASE WHEN winner LIKE ? THEN 1 ELSE 0 END) as opponentWins,
        SUM(CASE WHEN status = 'draw' THEN 1 ELSE 0 END) as draws
      FROM games 
      WHERE status IN ('won', 'draw') 
      AND (
        (player1 LIKE ? AND player2 LIKE ?) 
        OR 
        (player1 LIKE ? AND player2 LIKE ?)
      );
    `;

   
    const params = [
      `%${myId}%`, 
      `%${opponentId}%`, 
      `%${myId}%`, `%${opponentId}%`, 
      `%${opponentId}%`, `%${myId}%`
    ];

    db.get(query, params, (err: any, row: any) => {
      if (err) {
        console.error("DB Error getSessionScore:", err);
        return reject(err);
      }
      resolve({
        myWins: row?.myWins || 0,
        opponentWins: row?.opponentWins || 0,
        draws: row?.draws || 0
      });
    });
  });
};

export const deleteOldGames = async () : Promise<boolean> =>{
    return new Promise((resolve, reject) =>{
      db.run("DELETE FROM games WHERE created_at <= datetime('now', '-1 day')",(err)=>{
      if(err){
          console.error("DB Error deleteOldGames: ", err);
          return reject(err);
        }
        resolve(true);
      });
    });
};
