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
    return res.send({
        code: 404,
        message: "UserService: Route not found"
    });
});

app.use((err, req, res, next) => {
    console.error("UserService Error: ", err.stack);
    res.send({
        code: 500,
        message: "UserService: Something went wrong!", error: err.message
    });
});

module.exports = app;