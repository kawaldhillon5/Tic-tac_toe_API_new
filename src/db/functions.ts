import db from "./index.js";
import { GetUsername } from "../utils/idGenerator.js";
import type { UserRow } from "../types/db.js";
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

export const createNewGame = (p1: Player, p2: Player) : Promise<string> =>{
  return new Promise((resolve, reject) =>{
    const id  = uuidv4();
    const board: Board = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
    ];

    db.run(
      "INSERT INTO games (id, board, player1, player2, current_turn ) VALUES (?, ?, ?, ?, ? )",
      [
        id,
        JSON.stringify(board),
        JSON.stringify(p1),
        JSON.stringify(p2),
        p1.gamerId,
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