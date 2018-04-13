import jwt  from 'jsonwebtoken';
import crypto  from 'crypto';
import bcrypt from 'bcrypt';
import HttpStatus  from 'http-status-codes';

import encryptPassword from './../../util/encryption'
import errHandler from '../../util/errHandler'
import CONSTANTS from '../../util/constants'
import User from '../models/users.js';
import Login  from '../models/loginSchema';
import Mail  from './SendMail.js';
import QUERYCTRL from './queryCtrl'

/*________________________________________________________________________
 * @Date        :   08 Feb,2018
 * Modified by  :	Mansi Teharia, 22 Feb, 2018(Abhishek verma)
 * @Author      :   Abhishek verma
 * @Purpose     :   This function is used to login.
 _________________________________________________________________________
*/
const login = async (req, res) => {
    let { email, password } = req.body,
        query = {},
        populateObj = [true, 'country', ['name', 'code', 'currencyCode']],
        projection = {  _v : 0 };
    if (email && password){
        query = { email : email };
        let response = await QUERYCTRL.getData(req, res, User, query, projection, populateObj)
        if(response[0] && response[0].status) {
            let result = await bcrypt.compare(password, response[0]._doc.password);
            if (result) {
                let token = jwt.sign({ 
                    data: { 
                        email: response[0].email, accountType: response[0].accountType,
                        _id: response[0]._id 
                    }, exp: CONSTANTS.JWT.EXPIRY_TIME, }, CONSTANTS.JWT.SECRET_KEY);
                let data = { body: { userId: response[0]._id, token: token } }
                let isLoginTrack = await QUERYCTRL.saveData(data, res, Login)
                if (isLoginTrack)
                    res.send(CONSTANTS.getLoginMessage(response[0], token))
            } else {
                res.send({ message: CONSTANTS.LOGIN.INVALID_PASSWORD,status:HttpStatus.NOT_FOUND })
            }
        } else {
            res.send(CONSTANTS.getLoginErrorMessage(response[0]))
        }
    } else 
        res.send({ message: CONSTANTS.FILLALLFIELDS, status: HttpStatus.NOT_FOUND })
}

/*________________________________________________________________________
 * @Date        :   08 Feb,2018
 * Modified On  :	-
 * @Author      :
 * @Purpose     :   This function is used to logout(*******NOT COMPLETED)
 _________________________________________________________________________
*/
const logout = (req, res) => {
    if (req.headers.token) {
        Login.remove({ token: req.headers.token }, (err, data) => {
            if (err) {
                res.send(errHandler(err))
            }
            else {
                if (data.result.n > 0) {
                    res.send({ message: CONSTANTS.LOGOUT.SUCCESS, status: HttpStatus.OK })
                }
                else {
                    res.send({ message: CONSTANTS.LOGOUT.NOT_FOUND, status: HttpStatus.NOT_FOUND })
                }
            }
        })
    }
    else {
        res.send({ message: CONSTANTS.FILLALLFIELDS, status: HttpStatus.NOT_FOUND })
    }
}

/*________________________________________________________________________
 * @Date        :   15 Feb,2018
 * Modified On  :	15 Feb,2018
 * @Author      :   Mansi Teharia
 * @Purpose     :   This function is used to change password.
 _________________________________________________________________________
*/
const changePassword = async (req, res) => {
    let query       = {}, projection  = {}, updatedPassword = { body: { password : ''}},
        { oldPassword, newPassword, confirmPassword } = req.body,
        condition   = oldPassword && newPassword && confirmPassword 
        if (condition) {
            if (newPassword == confirmPassword){
                let decoded = await jwt.verify(req.headers.token, CONSTANTS.JWT.SECRET_KEY);
                if (!decoded){
                    res.send({ error: CONSTANTS.UNAUTHORIZED, status: HttpStatus.UNAUTHORIZED })
                } else {
                    query = { email : decoded.data.email}
                    let response =  await QUERYCTRL.getOnedata(req, res, User, query, projection);
                    if(response) {
                        let result = await bcrypt.compare(oldPassword, response.password)
                        if (result) {
                            if ( newPassword == oldPassword ) {
                                res.send({ message: CONSTANTS.PASSWORD.SAME, status: HttpStatus.NOT_FOUND})
                            } else {
                                let validatePassword = CONSTANTS.PATTERN.PASSWORD.test(req.body.newPassword)
                                if (!validatePassword)
                                    return res.send(errHandler({ name: 'passwordValidationError' }))
                                updatedPassword.body.password = await encryptPassword(req.body.newPassword)
                                let data = await QUERYCTRL.updateData(updatedPassword, res, User, query)
                                if (data.nModified) {
                                    Login.remove({ userId: decoded.data._id }, (err, data) => {})
                                    res.send({ message: CONSTANTS.PASSWORD.SUCCESS, status: HttpStatus.OK });
                                    Mail.passwordConfirmationMail(newPassword, response);
                                }
                            }
                        } else {
                            res.send({ message: CONSTANTS.PASSWORD.INCORRECT, status: HttpStatus.NOT_FOUND})
                        }
                    } else {
                        res.send({ message: CONSTANTS.LOGIN.INVALID_EMAIL, status: HttpStatus.NOT_FOUND})
                    }
                }
            }
            else
                res.send({ message: CONSTANTS.PASSWORD.MISMATCHED, status: HttpStatus.NOT_FOUND })
        } else {
            res.send({ message: CONSTANTS.PASSWORD.REQUIRED, status: HttpStatus.NOT_FOUND })
        }
}

/*________________________________________________________________________
 * @Date        :   08 Feb,2018
 * Modified On  :	15 Feb,2018
 * @Author      :   Mansi Teharia
 * @Purpose     :   This function is used to send email on regitered email id
 _________________________________________________________________________
*/
var forgotPassword = async (req, res) => {
    let query = { email: req.body.email },
        projection = { _v: 0 },
        response = await QUERYCTRL.getOnedata(req, res, User, query, projection)
    if (response) {
        let buf = await crypto.randomBytes(5),
            token = buf.toString('hex'),
            newValue = { body: { resetPasswordToken: token, resetPasswordExpires: CONSTANTS.PASSWORD.RESET_PASSWORD_EXPIRY } },
            isSave = await QUERYCTRL.updateData(newValue, res, User, query)
        if (isSave) {
            res.status(HttpStatus.OK).send({ message: CONSTANTS.PASSWORD.SENT_EMAIL, status: HttpStatus.OK });
            let mail = Mail.resetPwdMail(response, token);
        }
    } else {
        res.send({ message: CONSTANTS.PASSWORD.INVALID_EMAIL, status: HttpStatus.NOT_FOUND });
    }
};

/*________________________________________________________________________
 * @Date        :   15 Feb,2018
 * Modified On  :	-
 * @Author      :   Mansi Teharia
 * @Purpose     :   This function is used  to reset password.
 _________________________________________________________________________
*/
 const resetPassword = async (req, res) => {
    let query       = {resetPasswordToken: req.params.token},
        { newPassword, confirmPassword } = req.body,
        projection  = {},
        checkPassword   = newPassword && confirmPassword;
    if (checkPassword) {
        if ( newPassword == confirmPassword){
            let response =  await QUERYCTRL.getOnedata(req, res, User, query, projection);
            if(response) {
                let validatePassword = CONSTANTS.PATTERN.PASSWORD.test(newPassword)
                if(!validatePassword)
                    return res.send(errHandler({name:'customValidationError'}))
                req.body.password = await encryptPassword(newPassword)
                req.body.resetPasswordToken = "";
                let data    = await QUERYCTRL.updateData(req, res, User, query)
                if(data){
                    Login.remove({ userId: response._id }, (err, data) => { })
                    res.send({ message: CONSTANTS.PASSWORD.SUCCESS, status: HttpStatus.OK });
                    Mail.passwordConfirmationMail(newPassword, response);
                }
            } else {
                res.send({message : CONSTANTS.PASSWORD.EXPIRED,status:HttpStatus.NOT_FOUND})
            }
        } else {
            res.send({ message: CONSTANTS.PASSWORD.MISMATCHED, status: HttpStatus.NOT_FOUND })
        }
    } else {
        res.send({ message: CONSTANTS.PASSWORD.REQUIRED, status: HttpStatus.NOT_FOUND })
    }
}


let publicApi = {
    login,
    logout,
    changePassword,
    forgotPassword,
    resetPassword
};
export default publicApi;
