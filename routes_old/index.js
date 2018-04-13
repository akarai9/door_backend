import express from 'express';
import admin from '../app/controllers/adminCtrl'

var router = express.Router();

/* GET home page. */
router.get('/',  (req, res, next)  => {
    res.render('index', {title: 'express'});
});

/* Create default door user */
router.post('/createDefaultUser', admin.createDefaultUser)

export default router;
