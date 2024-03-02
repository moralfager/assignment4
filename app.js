require('dotenv').config();
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');

// create PORT
const PORT = 3000 || process.env.PORT;

// create application
const app = express();

// set view engine
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// set middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(cookieParser());

// connecting to database
mongoose.connect(process.env.MONGODB_URI)
    .then((result) => {
        console.log("Database connneted");
        return app.listen(PORT);
    })
    .catch((err) => console.log(err));

// set route
app.get('*', checkUser);
app.use(authRoutes);