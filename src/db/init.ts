import db from './index.js';

const initDb = () => {
  db.serialize(() => {
    // 1. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at INTEGER
      )
    `);

    // 2. Games Table
    // We will JSON.stringify() it.
    db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        player_x_id TEXT,
        player_o_id TEXT,
        board TEXT, 
        status TEXT,
        current_turn TEXT,
        winner_id TEXT,
        created_at INTEGER,
        FOREIGN KEY(player_x_id) REFERENCES users(id),
        FOREIGN KEY(player_o_id) REFERENCES users(id)
      )
    `);

    console.log('Tables initialized successfully');
  });

  db.close();
};

initDb();