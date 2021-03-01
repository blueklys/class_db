const express = require("express")
const app = express()
const bodyParser = require("body-parser")
require('dotenv').config()
const mysql = require("mysql")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const session = require("express-session")
const methodOverride = require("method-override")


const db = mysql.createConnection({
    host : process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
})



app.set('view engine', 'ejs')
app.use(express.static('./public'));
app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({extended:true}))
app.use(session({secret: 'math', resave: true, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())






app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/views/index.html')
})
app.get('/register', (req, res)=>{
    res.render('register.ejs')
})

app.get('/mypage',loginProcess, (req, res)=>{
    console.log(req.user)
    res.render('mypage.ejs', {user : req.user[0]})
})

function loginProcess(req, res, next){
    if(req.user){
        next()
    } else{
        res.redirect('/')
    }
}


app.get('/list', (req, res)=>{
    const username = req.user[0].username
    db.query("SELECT * FROM listdb WHERE username=?", username, (err, result)=>{
        console.log(result)
        if(err){console.log(err)}
        else{res.render('list.ejs', { classlog : result})}
    })
})

app.post('/list', (req, res)=>{
    console.log(req.body)
    const username = req.user[0].username
    const name = req.user[0].name
    const classname = req.body.classname
    const classtime = req.body.classtime
    const classnote = req.body.classnote
    db.query("INSERT INTO listdb (username, name, classname, classtime, classnote) VALUES (?,?,?,?,?)",
 [username, name, classname, classtime, classnote], (err, result)=>{
    if(err){console.log(err)}
    else{res.redirect('mypage')}
    })
})


app.get('/edit/:id', (req, res)=>{
    db.query("SELECT * FROM listdb WHERE id=?", parseInt(req.params.id), (err, result)=>{
        console.log(result)
        res.render('edit.ejs', {editlog : result[0]})
    })
})

app.put('/edit', (req, res)=>{
    console.log(req.user)
    const id = req.body.id
    const username = req.user[0].username
    const classname = req.body.classname
    const classtime = req.body.classtime
    const classnote = req.body.classnote
    db.query("UPDATE listdb SET username=?, classname=?, classtime=?, classnote=? WHERE id= ?", 
[username, classname, classtime, classnote, id], (err,result)=>{
    if(err){console.log(err)}
    else{res.redirect('/list')}
    })
})



app.get('/fail', (req, res)=>{
    res.send('로그인 실패. 학번을 등록해주세요!')
})

app.get('/logout', (req, res)=>{
    req.logOut()
    res.redirect('/')
})


app.post('/register', (req, res)=>{
    console.log(req.body)
    const username = req.body.username
    const name = req.body.name
    const nickname = req.body.nickname
    const password = req.body.password
    db.query("INSERT INTO users (username, name, nickname, password) VALUES (?,?,?,?)",
    [username, name, nickname, password], (err, result)=>{
        if(err){console.log(err)}
        else{res.redirect('/')}
    })
})

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), (req, res)=>{
    res.redirect('/mypage')
})

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    session: true,
    passReqToCallback: false,
  }, (username, password, done)=>{
      db.query('SELECT * FROM users WHERE username=?', username, (err, result)=>{
          console.log(result)
        if(err) console.log('mysql 에러');  
        if(result.length === 0){
          return done(null, false, { message: '유저가 존재하지 않습니다.' });
        }
        if(password!==result[0].password){
          return done(null,false, {message:'잘못된 비밀번호입니다.'})
        }
          return done(null,result) 
      })
    }
  ))

  passport.serializeUser(function (user, done) {
    done(null, user[0].username);
});

passport.deserializeUser(function(username, done) {
    db.query("SELECT * FROM users WHERE username = ?;", username, (err, result) => {
        done(null, result);  
    })
});


app.listen(process.env.PORT, ()=>{
    console.log("서버동작중"+ process.env.PORT +"포트")
})
