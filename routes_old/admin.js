import express from 'express';
import admin from '../app/controllers/adminCtrl'
var router = express.Router();

/* GET test. */
router.get('/', function (req, res) {
    res.send({ title: 'admin' });
});

/* GET Excel Data Test  */
router.get('/getExeceldata', admin.getExeceldata)

/* For User CRUD */
router.route('/user/:type?/:id?')
    .get(admin.getUser)
    .post(admin.addUser)
    .delete(admin.deleteUser)
    .put(admin.updateUser)

/* For Country CRUD */
router.route('/country/:id?')
    .get(admin.getCountry)
    .post(admin.addCountry)
    .delete(admin.deleteCountry)
    .put(admin.updateCountry)

/* For CRUD Royalty Fees Type A  */
router.route('/royaltyFeesTypeA/:id?')
    .post(admin.addRoyaltyFeesTypeA)
    .get(admin.getRoyaltyFeesTypeA)
    .put(admin.updateRoyaltyFeesTypeA)
    .delete(admin.deleteRoyaltyFeesTypeA)


router.route('/changeDoorStatus/:id')
    .post(admin.changeDoorStatus)

/* Royalty Fee Filter */
router.route('/royaltyFeeFilter')
    .post(admin.royaltyFeeFilter)

module.exports = router;