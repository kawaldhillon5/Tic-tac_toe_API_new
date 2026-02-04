import db from "./index.js";
import { GetUsername } from "../utils/idGenerator.js";

// Define what a DB row looks like
export interface UserRow {
  id: string;
  username: string;
  created_at: number;
}

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
    // Currently using ID as username, but flexible for future
    const newUsername = newId; 
    const now = Date.now();

    db.run(
      "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
      [newId, newUsername, now],
      function (err) {
        if (err) {
          console.error("DB Error createNewUserInDB:", err);
          return reject(err);
        }
        // Return the full user object so the socket can use it immediately
        resolve({
          id: newId,
          username: newUsername,
          created_at: now
        });
      }
    );
  });
};