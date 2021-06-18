var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
app.use(bodyParser.json());

module.exports.isloggedIn = function isLoggedIn(req,res,next){
    if(req.headers.authorization)
    {
        next();
    }else{
        res.json({
            message:'unauthorized'
        },400);
    }
};