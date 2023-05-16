const mysql = require("mysql")
const express = require("express")
const app = express()
const passport = require("passport")
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;
const GOOGLE_CLIENT_ID = '25172725730-q0utjut13os6gpbgel9o76f4s7is86j3.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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'; 
require("dotenv").config()

const connection = mysql.createConnection({
    host:process.env.HOST,
    user:process.env.USER,
    database:process.env.DATABASE,
    password:process.env.PASSWORD
});

connection.connect((e) => {
    if(e) throw e
    else console.log("Connected")
})

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    connection.query('select * from users where googleId = ?', [profile.id], (err, rows) =>{
        if(err){
            return done(err)
        }
        if(rows.length){
            return done(null, rows[0]);           
        }else{
            const newUser = {
                googleId: profile.id,
                username: profile.displayName,
                email: profile.emails[0].value,
            }
            connection.query('insert into users set ?', newUser, (err, result) =>{
                if(err){
                    return done(err);
                }
                newUser.id = result.insertId;
                return done(null, newUser);
            })
        }
    })
    return done(null, profile);
  }
));

passport.serializeUser(function(user, done){
    done(null, user);
})

passport.deserializeUser(function(user, done){
    done(null, user);
})