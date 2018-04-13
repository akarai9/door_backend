import jwt from 'jsonwebtoken';
import HttpStatus from 'http-status-codes';
import CONSTANTS from './constants'
import AUTHORISATION from './authorisation'
import QUERYCTRL from '../app/controllers/queryCtrl'
import Login from '../app/models/loginSchema';

module.exports = async (req, res, next) => {
    let query = { token: req.headers.token}
    let response = await QUERYCTRL.getData(req, res, Login, query)
    if (!response.length)
        return res.send({ error: CONSTANTS.UNAUTHORIZED, status: HttpStatus.UNAUTHORIZED })
    let decoded = jwt.verify(req.headers.token, CONSTANTS.JWT.SECRET_KEY, (err, decoded) => {
        if (err)
            res.send({ error: err.message, status: HttpStatus.UNAUTHORIZED })
        else {
            if (AUTHORISATION(req.baseUrl, decoded.data.accountType)){
                res.locals.decodedToken = decoded.data;
                next()
            }
            else
                res.send({ error: CONSTANTS.UNAUTHORIZED, status: HttpStatus.UNAUTHORIZED })
        }
    });
    // next()
}