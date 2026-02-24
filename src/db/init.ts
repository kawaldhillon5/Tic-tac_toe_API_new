import db from './index.js';

const initDb = () => {
  db.serialize(() => {
    
    // 2. Games Table
    db.run(`
      CREATE TABLE IF NOT EXISTS games (
        id Text PRIMARY KEY ,
        board TEXT NOT NULL,
        player1 TEXT,
        player2 TEXT,
        current_turn TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        winner TEXT,
        created_at INTEGER
      )
    `);

    console.log('Tables initialized successfully');
  });

  db.close();
};

initDb();