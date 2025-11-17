const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
require('dotenv').config();

app.use(cors()); 
app.use(morgan('dev'));
app.use(express.json());

// Fuerza el charset UTF-8 en todas las respuestas JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

const routes = require('./src/routes/index');
app.use(routes);

app.listen(process.env.PORT_API, () => {
  console.log('Server running!');
});