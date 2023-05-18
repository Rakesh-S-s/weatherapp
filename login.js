const express = require("express")
const mysql = require("mysql2")
const bodyParser = require("body-parser")
const session = require("express-session")
const encoder = bodyParser.urlencoded();
const app = express()
const jwt = require('jsonwebtoken')
const passport = require("passport")
require("dotenv").config()
require("./auth")

app.use("/images",express.static("images"))
app.use("/public",express.static("public"))
app.use("/pages",express.static("pages"))
app.use("/assets",express.static("assets"))

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set("views", __dirname + "/views");

const connection = mysql.createPool({
    host:process.env.HOST,
    user:process.env.USER,
    database:process.env.DATABASE,
    password:process.env.PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

connection.getConnection((e) => {
    if(e) throw e
    else console.log("Connected")
})

app.use(session({
    secret : 'secret',
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

const authCheck = (req, res, next) => {
    if(req.session.loggedin ){
        next();
    }else if(req.isAuthenticated()){
        next();
    }else{
        res.redirect("/")
    }
}

function verifyToken(req, res, next){
    const token  = req.headers['authorization'];
    if(!token){
        res.json({message: 'missing token'})
        return;
    }
    try{
        const decoded = jwt.verify(token, 'secret');
        req.user = decoded;
        next();
    }catch(err){
        res.json({message: 'Invalid token'})
        return;
    }
}

app.get("/", (req,res) => {
    res.sendFile(__dirname + "/pages/login.html");
}) 

app.get("/auth/google", passport.authenticate('google', { scope : ['profile', 'email']}));

app.post("/", (req,res) => {
    var email = req.body.email;
    var password = req.body.pass;
    connection.query("select * from users where email = ? and password = ?",[email, password], (error,results) => {
        if(results.length>0){
            req.session.loggedin = true;
            req.session.email = email;
            req.session.save();
            const token = jwt.sign({email}, 'secret', {expiresIn: '1h'});
            res.cookie('jwt', token, {httpOnly: true, secure: true})
            if(!results[0].favorite_place){
                res.redirect("/favorite_place")
            }else{
                res.redirect("/weather");    
            }
        }else{
            res.redirect("/");
        }
        res.end();
    })
})

app.get("/favorite_place", authCheck, (req, res) => {
    res.sendFile(__dirname + "/pages/favorite_place.html")
})

app.post("/favorite_place",authCheck || verifyToken,async (req, res) => {
    const email = req.session.email || req.user.emails[0].value;
    const favorite_place = req.body.favorite_place;

    connection.query('update users set favorite_place = ? where email = ?', [favorite_place, email], function(err, results, fields){
        if(err) throw err;
        res.redirect('/weather');
    })
})

app.get("/weather",authCheck ||  verifyToken , async (req,res) => {
    //res.sendFile(__dirname + "/index.html")
    const email = req.session.email || req.user.emails[0].value;
    const name = email.split('@')
    const capName = name[0].charAt(0).toUpperCase() + name[0].slice(1);
    connection.query('select * from users where email = ?', [email], function(err, results){
        res.render('index',{email: capName, fav: results[0].favorite_place})
    });
})


app.get('/auth/google/callback',
    passport.authenticate('google', {failureRedirect : '/'}),
    function(req, res){
        const email = req.user.emails[0].value;
        connection.query("select * from users where email = ?", [email] ,(err, results, fields) => {
        if(results.length>0){
            if(!results[0].favorite_place){
                res.redirect("/favorite_place")
            }else{
                res.redirect("/weather"); 
            }
        }else{
            res.redirect("/");
        }
    res.end();
})
})

app.post("/signup", encoder, async (req,res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    connection.query("insert into users(username, email, password) values(?,?,?)",[username, email, password]);
    res.redirect('/');
    res.end();
})

app.get("/logout", (req, res)=>{
    req.session.loggedin = false;
    req.session.email = null;
    req.session.destroy();
    res.redirect("/")
})

app.get("/check",async (req,res)=>{
    await connection.query("select * from users",(err,results)=>{
        res.json({details: results[0]})
    })
})

app.listen(3000);