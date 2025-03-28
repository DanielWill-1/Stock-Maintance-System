require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection using environment variables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Database connected successfully');
    release();
});

// Get all stock items
app.get('/stocks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stock');
        console.log('Fetched from DB:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching stocks:', err);
        res.status(500).send('Server error');
    }
});

// Add new stock item
app.post('/stocks', async (req, res) => {
    const { name, quantity, price } = req.body;
    console.log('Received POST data:', { name, quantity, price });
    try {
        const result = await pool.query(
            'INSERT INTO stock (name, quantity, price) VALUES ($1, $2, $3) RETURNING *',
            [name, quantity, price]
        );
        console.log('Inserted into DB:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting stock:', err);
        res.status(500).send('Server error');
    }
});

// Update stock item
app.put('/stocks/:id', async (req, res) => {
    const { id } = req.params;
    const { name, quantity, price } = req.body;
    try {
        const result = await pool.query(
            'UPDATE stock SET name = $1, quantity = $2, price = $3 WHERE id = $4 RETURNING *',
            [name, quantity, price, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Delete stock item
app.delete('/stocks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM stock WHERE id = $1', [id]);
        res.json({ message: 'Item deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get("/approvals", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM approvals");
        console.log("Database response:", result.rows);  // ✅ Debugging Log
        res.json(result.rows);  // ✅ Ensure JSON array is sent
    } catch (error) {
        console.error("Error fetching approvals:", error); // ❌ Log error details
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/approvals", async (req, res) => {
    const { item_name, requestor_name, requested_quantity } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO approvals (item_name, requestor_name, requested_quantity, status) VALUES ($1, $2, $3, 'Pending') RETURNING *",
            [item_name, requestor_name, requested_quantity]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding approval:", error);
        res.status(500).json({ error: "Failed to add approval request" });
    }
});


app.put("/approvals/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            "UPDATE stock_maintenance1 SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

