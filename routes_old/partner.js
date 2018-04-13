import express from 'express';
import partner from '../app/controllers/partnerCtrl'
var router = express.Router();

/* GET test. */
router.get('/', function (req, res) {
    res.send({ title: 'partner' });
});

module.exports = router;