const express = require("express");
const cors = require("cors");
const {Pool} = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next)=>{
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({error: "Access denied"});
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({error: "Invalid token"});
        req.user = user;
        next();
    });
};

