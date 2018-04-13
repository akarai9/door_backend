import express from 'express';
import path from 'path';
import device from 'express-device';
import bodyParser from 'body-parser';
import logger from 'morgan';
import cors from 'cors';
import fileUpload from 'express-fileupload';

module.exports = (app) => {
    // view engine setup
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'pug');

    app.use(device.capture());
    app.use(bodyParser({ limit: '50mb' }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(logger('dev'));
    app.use(cors());
    app.use(express.static('public'))
    app.use(fileUpload());
}