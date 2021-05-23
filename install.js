const {openDb} = require("./db")

const tablesNames = ["users","articles","comments","art_votes"]


async function initDb(db){
  const max = await db.run(`INSERT INTO users(login,password,email) VALUES("max", "max", "max@test.com")`)
  const bob = await db.run(`INSERT INTO users(login,password,email) VALUES("bob", "bob", "bob@test.com")`)

  const art = await db.run(`INSERT INTO articles(author_id, title, content, date_post, score) VALUES(1,"J'adore !","https://www.google.fr/",datetime('now'),0)`)
  const com = await db.run(`INSERT INTO comments(article_id, author_id, content, date_comment) VALUES(1, 2," Excellent site pour faire des recherches!",datetime('now'))`)
}

async function createTables(db){
  const users = db.run(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login varchar(255),
        password varchar(255),
        email varchar(255)
      );
  `)

  const articles = db.run(`
  CREATE TABLE IF NOT EXISTS articles(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER,
      title varchar(255),
      content text,
      date_post datetime,
      score INTEGER,
      FOREIGN KEY(author_id) REFERENCES users(id)
    );
  `)

  const comment = db.run(`
  CREATE TABLE IF NOT EXISTS comments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    author_id INTEGER,
    content text,
    date_comment datetime,
    FOREIGN KEY(author_id) REFERENCES users(id),
    FOREIGN KEY(article_id) REFERENCES article_id
  );
  `)

  const art_votes = db.run(`
  CREATE TABLE IF NOT EXISTS art_votes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    author_id INTEGER,
    value INTEGER,
    FOREIGN KEY(author_id) REFERENCES users(id),
    FOREIGN KEY(article_id) REFERENCES article_id
  );`)
  return await Promise.all([users,articles,comment,art_votes])
}


async function dropTables(db){
  return await Promise.all(tablesNames.map( tableName => {
      return db.run(`DROP TABLE IF EXISTS ${tableName}`)
    }
  ))
}

(async () => {
  // open the database
  let db = await openDb()
  await dropTables(db)
  await createTables(db)
  await initDb(db)
})()
