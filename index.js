const express = require('express');
const bodyParser = require('body-parser');
const {openDb} = require("./db")
const session = require('express-session');
var path = require('path');

const app = express();
const port = 3000;

const SQLiteStore = require('connect-sqlite3')(session);
const sess = {
  store: new SQLiteStore,
  secret: 'secret key',
  resave: true,
  rolling: true,
  cookie: {
    maxAge: 1000 * 3600//ms
  },
  saveUninitialized: true
}

app.use(session(sess))
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use("/img", express.static(path.join(__dirname, 'img')));

app.set('views', './views')
app.set('view engine', 'pug')

// ------------------function-------------------- // 

function validate_email(mail){
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if(mail.match(validRegex)){
        return true
    }

    else{
        return false
    }
}

async function get_user_name_from_id(id){
    const db = await openDb()

    const name = await db.get(`
    SELECT login FROM users
    WHERE id = ?
    `, [id])
    return name.login
}

async function get_user_id_from_mail(mail){
    const db = await openDb()

    const user = await db.get(`
    SELECT id FROM users
    WHERE email = ?
    `, [mail])
    return user.id
}

async function get_authorid_from_articleid(article_id){
    const db = await openDb()

    const author_id = await db.get(`
    SELECT author_id FROM articles
    WHERE id = ?
    `, [article_id])

    return author_id.author_id
}

async function new_article(author_id, title, content){
    const db = await openDb()
    
    const art = await db.run(`
    INSERT INTO articles(author_id, title, content, date_post, score) VALUES(?,?,?,datetime('now'),0)
    `, [author_id,title,content])

    return true
}

async function edit_article(article_id, title, content){
    const db = await openDb()

    const art = await db.run(`
    UPDATE articles
    SET title = ?, content = ?
    WHERE id = ?
    `, [title, content, article_id])

    return true
}

async function delete_article(article_id){
    const db = await openDb()

    const del = db.run(`
    DELETE FROM articles
    WHERE id = ?
    `, [article_id])

    return true
}

async function new_comment(author_id, article_id, content){
    const db = await openDb()
    
    const comment = await db.run(`
    INSERT INTO comments(article_id,author_id,content,date_comment) VALUES(?,?,?,datetime('now'))`, [article_id, author_id, content])

    return true
}

async function edit_comment(comment_id, content){
    const db = await openDb()

    const art = await db.run(`
    UPDATE comments
    SET content = ?
    WHERE id = ?
    `, [content, comment_id])

    return true
}

async function delete_comment(comment_id){
    const db = await openDb()

    const del = db.run(`
    DELETE FROM comments
    WHERE id = ?
    `, [comment_id])

    return true
}

async function load_all_articles(userid){
    const db = await openDb()
    
    const articles = await db.all(`
    SELECT * FROM articles ORDER BY date_post DESC`)

    let articles_w_name = []

    if(articles.legnth == 1)
    {
        articles_w_name.push(articles)
        articles_w_name[0].author = await get_user_name_from_id(articles_w_name.author_id)

        const vote_state = await db.get(`
        SELECT value FROM art_votes
        WHERE article_id = ?
        AND author_id = ?`, [articles_w_name.id, userid])

        if(vote_state){
            articles_w_name.vote_state = "vs"+vote_state.value
        }

        else{
            articles_w_name.vote_state = "vs0"
        }
    }

    else{
        for(let i = 0; i<articles.length;i++){
            articles_w_name.push(articles[i])
            articles_w_name[i].author = await get_user_name_from_id(articles_w_name[i].author_id)

            const vote_state = await db.get(`
            SELECT value FROM art_votes
            WHERE article_id = ?
            AND author_id = ?`, [articles_w_name[i].id, userid])

            if(vote_state){
                articles_w_name[i].vote_state = "vs"+vote_state.value
            }

            else{
                articles_w_name[i].vote_state = "vs0"
            }
        }
    }
    return articles_w_name
}

async function load_article(article_id, author_id){
    const db = await openDb()

    const article = await db.get(`
    SELECT * FROM articles
    WHERE id = ?
    `, [article_id])

    let article_w_name = article
    article_w_name.author = await get_user_name_from_id(article_w_name.author_id)
    
    const vote_state = await db.get(`
    SELECT value FROM art_votes
    WHERE article_id = ?
    AND author_id = ?`, [article_id, author_id])

    if(vote_state){
        article_w_name.vote_state = "vs"+vote_state.value
    }

    else{
        article_w_name.vote_state = "vs0"
    }

    return article_w_name
}

async function load_my_articles(userid){
    const db = await openDb()
    
    const articles = await db.all(`
    SELECT * FROM articles WHERE author_id = ? ORDER BY date_post DESC`, [userid])

    let articles_w_name = []

    if(articles.legnth == 1)
    {
        articles_w_name.push(articles)
        articles_w_name[0].author = await get_user_name_from_id(articles_w_name.author_id)
    }

    else{
        for(let i = 0; i<articles.length;i++){
            articles_w_name.push(articles[i])
            articles_w_name[i].author = await get_user_name_from_id(articles_w_name[i].author_id)

            const vote_state = await db.get(`
            SELECT value FROM art_votes
            WHERE article_id = ?
            AND author_id = ?`, [articles_w_name[i].id, userid])

            if(vote_state){
                articles_w_name[i].vote_state = "vs"+vote_state.value
            }

            else{
                articles_w_name[i].vote_state = "vs0"
            }
        }
    }
    return articles_w_name
}

async function load_comments(article_id){
    const db = await openDb()
    
    const comments = await db.all(`
    SELECT * FROM comments WHERE article_id = ? ORDER BY date_comment DESC`, [article_id])

    let comments_w_name = []

    if(comments.legnth == 1)
    {
        comments_w_name.push(comments)
        comments_w_name[0].author = await get_user_name_from_id(comments_w_name.author_id)
    }

    else{
        for(let i = 0; i<comments.length;i++){
            comments_w_name.push(comments[i])
            comments_w_name[i].author = await get_user_name_from_id(comments_w_name[i].author_id)
        }
    }

    return comments_w_name
}

async function load_comment(comment_id){
    const db = await openDb()

    const comment = await db.get(`
    SELECT * FROM comments
    WHERE id = ?
    `, [comment_id])

    let comment_w_name = comment
    comment_w_name.author = await get_user_name_from_id(comment_w_name.author_id)


    console.log(comment_w_name)
    return comment_w_name
}

// ------------------app-------------------- // 

app.get('/', function(req, res) {
    if(req.session.logged){
        res.redirect(302,'/home')
    }
    else{
        res.render('index', {good_logs : true})
    }
})

app.get('/register', function(req, res) {
    res.render('register')
})

app.get('/home', async (req,res) => {
    if(req.session.logged){
        res.render('home', {login : await get_user_name_from_id(req.session.userid), articles : await load_all_articles(req.session.userid)})
    }
    else{
        res.redirect(302, '/')
    }
})

app.post('/disconnect', async (req,res) => {
    req.session.userid = -1
    req.session.logged = false
    res.redirect(302,'/')
})

app.post('/home', async (req, res) => {
    const db = await openDb()
    
    const data = {
        email : req.body.email,
        password : req.body.password
    }

    const user = await db.get(`
    SELECT * FROM users
    WHERE email = ?
    AND password = ?
    `, [data.email, data.password])

    if(user){
        if(user.email == data.email && user.password == data.password){
            req.session.logged = true
            req.session.userid = await get_user_id_from_mail(data.email)
            res.render('home', {login : await get_user_name_from_id(req.session.userid), articles : await load_all_articles(req.session.userid)})
        }
    }
    
    else{
        res.render('index', {good_logs : false})
    }
})

app.post('/register', async (req,res) => {
    const db = await openDb()

    const data = {
        name : req.body.name,
        email : req.body.email,
        password : req.body.password,
        c_password : req.body.c_password
    }

    const error = {
        e_not_empty : false,
        e_all : [],
        validate : false
    }

    const registered = {
        validate : true
    }

    if(data.name.length < 5){
        error.e_not_empty = true
        error.e_all.push("Votre pseudo est trop court (minimum 5 caractères).")
    }

    if(data.password.length < 6){
        error.e_not_empty = true
        error.e_all.push("Le mote de passe est trop court (minimum 6 caracètres).")
    }

    if(data.c_password != data.password){
        error.e_not_empty = true
        error.e_all.push("La confirmation du mot de passe ne correpond pas.")
    }

    if(!(validate_email(data.email))){
        error.e_not_empty = true
        error.e_all.push("L'email entré n'est pas valide.")
    }
    
    const user_ae = await db.get(`
        SELECT * FROM users
        WHERE login = ?
    `, [data.name])

    if(user_ae){
        error.e_all.push("Ce pseudo existe déjà.")
        error.e_not_empty = true
    } 

    const email_ae = await db.get(`
        SELECT * FROM users
        WHERE email = ?
    `, [data.email])

    if (email_ae){
        error.e_all.push("Cet email est déjà utilisé.")
        error.e_not_empty = true
    }

    if(error.e_not_empty){
        res.render('register', error)
    }

    else{
        const reg = await db.run(`
        INSERT INTO users(login, password, email) VALUES(?, ?, ?)`
        , [data.name, data.password, data.email])

        res.render('register', registered)
    }
})

app.post('/upvote/:id', async (req,res) =>{
    const db = await openDb()

    const vote = await db.get(`
    SELECT * FROM art_votes
    WHERE author_id = ?
    AND article_id = ?
    `, [req.session.userid, req.params.id])

    if(!vote){
        const upvote = await db.run(`
        UPDATE articles
        SET score = score + 1
        WHERE id = ?
        `, [req.params.id])

        const n_vote = await db.run(`
        INSERT INTO art_votes(article_id,author_id,value) VALUES(?,?,?)`
        , [req.params.id,req.session.userid,1])
    }

    else{
        if(vote.value == 1){
            const upvote = await db.run(`
            UPDATE articles
            SET score = score - 1
            WHERE id = ?
            `, [req.params.id])

            const n_vote = await db.run(`
            DELETE FROM art_votes
            WHERE article_id = ?
            AND author_id = ?`
            , [req.params.id,req.session.userid])
        }

        else if(vote.value == -1){
            const upvote = await db.run(`
            UPDATE articles
            SET score = score + 2
            WHERE id = ?
            `, [req.params.id])

            const n_vote = await db.run(`
            UPDATE art_votes SET value = 1 WHERE article_id = ? AND author_id = ?
            `, [req.params.id,req.session.userid])
        }
    }

    res.redirect('back')
})

app.post('/downvote/:id', async (req,res) =>{
    const db = await openDb()

    const vote = await db.get(`
    SELECT * FROM art_votes
    WHERE author_id = ?
    AND article_id = ?
    `, [req.session.userid, req.params.id])

    if(!vote){
        const downvote = await db.run(`
        UPDATE articles
        SET score = score - 1
        WHERE id = ?
        `, [req.params.id])

        const n_vote = await db.run(`
        INSERT INTO art_votes(article_id,author_id,value) VALUES(?,?,?)`
        , [req.params.id,req.session.userid,-1])
    }

    else{
        if(vote.value == -1){
            const downvote = await db.run(`
            UPDATE articles
            SET score = score + 1
            WHERE id = ?
            `, [req.params.id])

            const n_vote = await db.run(`
            DELETE FROM art_votes
            WHERE article_id = ?
            AND author_id = ?`
            , [req.params.id,req.session.userid])
        }

        else if(vote.value == 1){
            const downvote = await db.run(`
            UPDATE articles
            SET score = score - 2
            WHERE id = ?
            `, [req.params.id])

            const n_vote = await db.run(`
            UPDATE art_votes SET value = -1 WHERE article_id = ? AND author_id = ?
            `, [req.params.id,req.session.userid])
        }
    }

    res.redirect('back')
})

app.get('/profil/', async (req,res) => {
    if(req.session.logged)
    {
        res.render('profile', {login : await get_user_name_from_id(req.session.userid), 
                                articles : await load_my_articles(req.session.userid)})
    }
    else{
        res.redirect(302,'/')
    }
})

app.get('/link/:id', async (req,res) => {
    if(req.session.logged){
        res.render('article', {login : await get_user_name_from_id(req.session.userid), 
                                article : await load_article(req.params.id, req.session.userid),
                                edit : req.session.userid == await get_authorid_from_articleid(req.params.id),
                                comms : await load_comments(req.params.id)})
    }
    else{
        res.redirect(302, '/')
    }
})

app.get('/edit_link/:id', async (req,res) => {
    if(req.session.logged){
        res.render('edit_article', {login : await get_user_name_from_id(req.session.userid), article : await load_article(req.params.id)})
    }
    else{
        res.redirect(302,'/')
    }
})

app.post('/edit_link_c/:id', async (req,res) => {
    await edit_article(req.params.id, req.body.edit_art_title, req.body.edit_art_content)
    res.redirect(302,'/link/'+req.params.id)
})

app.post('/delete_link/:id', async (req,res) => {
    await delete_article(req.params.id)
    res.redirect(302,'/home')
})



app.get('/edit_com/:id', async (req,res) => {
    if(req.session.logged){
        res.render('edit_comment', {login : await get_user_name_from_id(req.session.userid), comment : await load_comment(req.params.id)})
    }
    else{
        res.redirect(302,'/')
    }
})

app.post('/edit_com_c/:id', async (req,res) => {
    await edit_comment(req.params.id, req.body.edit_com_content)
    res.redirect(302,'/')
})

app.post('/delete_com/:id', async (req,res) => {
    await delete_comment(req.params.id)
    res.redirect('back')
})



app.post('/new_article', async (req,res) => {
    const data = {
        title : req.body.new_art_title,
        link : req.body.new_art_link
    }

    if(data.title && data.link){
        await new_article(req.session.userid, data.title, data.link)
        res.redirect('back')
    }
})

app.post('/add_com/:id', async (req,res) => {
    if(req.body.com_content)
    {
        await new_comment(req.session.userid,req.params.id,req.body.com_content)
        res.redirect('back')
    }
})

app.use(function(req,res,next) {
    res.status(404).send("Erreur 404 : La page que vous cherchez n'existe pas !")
})

app.listen(port, function(){
    console.log('Listening on port 3000 ...')
})