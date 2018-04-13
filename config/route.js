import express from 'express';
import index from '../routes/index';
import api from '../routes/publicApi';
import admin from '../routes/admin';
import partner from '../routes/partner';
import adminPartner from '../routes/adminPartner';
import AUTHENTICATION from '../util/authentication'

module.exports = (app) => {
    let router = express.Router();
    router.use((req, res, next) => {
        AUTHENTICATION(req, res, next)
    });
    
    app.get('/hello', (req, res) => {
        res.send("Hi to " + req.device.type.toUpperCase() + " User");
    });
    
    app.use('/', index);
    app.use('/api', api);
    app.use('/admin', router, admin);
    app.use('/adminPartner', router, adminPartner);
}