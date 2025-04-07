require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000; // Use PORT from .env or default to 5000

// Middleware
app.use(cors({
    origin: 'http://localhost:5500', // Adjust to match your frontend's origin (e.g., live-server)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
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
        console.log('Fetched stocks from DB:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching stocks:', err.stack);
        res.status(500).json({ error: 'Failed to fetch stock items', details: err.message });
    }
});

// Add new stock item
app.post('/stocks', async (req, res) => {
    const { name, quantity, price } = req.body;
    console.log('Received POST data for stocks:', { name, quantity, price });
    if (!name || quantity === undefined || price === undefined) {
        return res.status(400).json({ error: 'Missing required fields: name, quantity, or price' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO stock (name, quantity, price) VALUES ($1, $2, $3) RETURNING *',
            [name, quantity, price]
        );
        console.log('Inserted into stock DB:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inserting stock:', err.stack);
        res.status(500).json({ error: 'Failed to add stock item', details: err.message });
    }
});

// Update stock item
app.put('/stocks/:id', async (req, res) => {
    const { id } = req.params;
    const { name, quantity, price } = req.body;
    console.log('Received PUT data for stock:', { id, name, quantity, price });
    if (!name || quantity === undefined || price === undefined) {
        return res.status(400).json({ error: 'Missing required fields: name, quantity, or price' });
    }
    try {
        const result = await pool.query(
            'UPDATE stock SET name = $1, quantity = $2, price = $3 WHERE id = $4 RETURNING *',
            [name, quantity, price, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Stock item not found' });
        }
        console.log('Updated stock in DB:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating stock:', err.stack);
        res.status(500).json({ error: 'Failed to update stock item', details: err.message });
    }
});

// Delete stock item
app.delete('/stocks/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Received DELETE request for stock ID:', id);
    try {
        const result = await pool.query('DELETE FROM stock WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Stock item not found' });
        }
        console.log('Deleted stock from DB:', result.rows[0]);
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Error deleting stock:', err.stack);
        res.status(500).json({ error: 'Failed to delete stock item', details: err.message });
    }
});

// Get all approval requests
app.get('/approvals', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM approvals');
        console.log('Fetched approvals from DB:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching approvals:', err.stack);
        res.status(500).json({ error: 'Failed to fetch approvals', details: err.message });
    }
});

// Add new approval request
app.post('/approvals', async (req, res) => {
    const { item_name, requestor_name, requested_quantity } = req.body;
    console.log('Received POST data for approvals:', { item_name, requestor_name, requested_quantity });
    if (!item_name || !requestor_name || requested_quantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields: item_name, requestor_name, or requested_quantity' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO approvals (item_name, requestor_name, requested_quantity, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [item_name, requestor_name, requested_quantity, 'Pending']
        );
        console.log('Inserted into approvals DB:', result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding approval:', err.stack);
        res.status(500).json({ error: 'Failed to add approval request', details: err.message });
    }
});

// Update approval status
app.put('/approvals/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log('Received PUT data for approval:', { id, status });
    if (!status) {
        return res.status(400).json({ error: 'Missing required field: status' });
    }
    try {
        const result = await pool.query(
            'UPDATE approvals SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Approval request not found' });
        }
        console.log('Updated approval in DB:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating approval:', err.stack);
        res.status(500).json({ error: 'Failed to update approval', details: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});