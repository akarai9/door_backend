import  express from 'express';
import  user from '../app/controllers/publicApi.js';
var router = express.Router();

/* GET test. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

/* To login  */
router.post('/login', user.login);

/* To logout  */
router.get('/logout', user.logout);

/* To changePassword  */
router.post('/changePassword', user.changePassword);

/* To changePassword  */
router.post('/resetPassword/:token', user.resetPassword);

/* To recover password. */
router.post('/forgotPassword', user.forgotPassword)


export default router;

