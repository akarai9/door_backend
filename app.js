require('dotenv').load();
import express from 'express';
// import os from 'os';

var app = express(),
    // ifaces = os.networkInterfaces(),
    env = process.env.NODE_ENV = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env];

require('./config/mongoose')(config)
require('./config/express')(app)
require('./config/route')(app)

app.listen(config.port, () => {
    console.log('Server is listening on host and port', config.port, "on", config.env, "mode.")
}).on('error', () => {
    console.log('Port',config.port,'is already in use.')
});

module.exports = app;