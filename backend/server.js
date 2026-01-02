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
    password: process.env.DATABASE_PASSWORD || undefined,
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

app.post("/api/auth/login", async (req, res)=>{
    try {
        const {email, password} = req.body;
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({error: "Invalid credentials"});
        }
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({error: "Invalid credentials"});
        }
        const token = jwt.sign(
            {id: user.id, email: user.email, role: user.role}, JWT_SECRET, {expiresIn: "24h"}
        );
        res.json({token: token, user: {id: user.id, email: user.email, role: user.role}});
    }
    catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.get("/api/requests", authenticateToken, async (req, res) => {
    try {
        let query = "SELECT r.*, u.email as creator_email FROM requests r JOIN users u ON r.user_id = u.id";
        if (req.user.role !== "admin") {
            query += " WHERE r.user_id = $1";
            const result = await pool.query(query, [req.user.id]);
            return res.json(result.rows);
        }
        const result = await pool.query(query + " ORDER BY r.created_at DESC");
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.post("/api/requests", authenticateToken, async (req, res) => {
    try {
        const {title, description, category, priority} = req.body;
        const result = await pool.query(
            `INSERT INTO requests (user_id, title, description, category, priority) VALUES 
            ($1, $2, $3, $4, $5) RETURNING *`, [req.user.id, title, description, category, priority || "medium"]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.patch("/api/requests/:id", authenticateToken, async (req, res) => {
    try {
        const {id} = req.params;
        const {status, title, description, priority} = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (status) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (title) {
            updates.push(`title = $${paramCount++}`);
            values.push(title);
        }
        if (description) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        if (priority) {
            updates.push(`priority = $${paramCount++}`);
            values.push(priority);
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const query = `UPDATE requests SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Request not found"});
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.delete("/api/requests/:id", authenticateToken, async (req, res) => {
    try {
        const {id} = req.params;
        const result = await pool.query("DELETE FROM requests WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json({message: 'Request deleted', deletedRequest: result.rows[0]});
    }
    catch (error) {
        res.status(500).json({error: error.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));