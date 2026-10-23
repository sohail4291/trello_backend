const express = require('express')
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken");
const {userModel} = require("./databases")

async function authmiddleware(req,res,next){
    const token = req.cookies.token;
    const decode = jwt.decode(token,"my-secret-key");
    const username = decode.username;
    
    if(!username){
        res.send({message : "Invalid credentials"});
        return;
    }
    console.log("username : ", username);
    req.username = username;
    const user =  await userModel.findOne({username : username});
    req.userId = user._id.toString();
    next();
}

module.exports = { authmiddleware : authmiddleware}