const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(express.json());
app.use(morgan('dev')); 
app.use(cors());

app.use('/api/users', userRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: 'User Service: Route not found' });
});

app.use((err, req, res, next) => {
    console.error('User Service Error:', err.stack);
    res.status(500).json({ message: 'User Service: Something went wrong!', error: err.message });
});

module.exports = app;