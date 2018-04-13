import HttpStatus from 'http-status-codes'
import fs from 'fs';
import xlsx from 'node-xlsx';

import UTILITY from '../../util/utilityMethod'
import CONSTANTS from '../../util/constants'
import User from '../models/users'
import RoyaltyFeesTypeA from '../models/royaltyFeesTypeA'
import Country from '../models/country'
import Report from '../models/monthlyReport'
import Mail from './SendMail'
import QUERYCTRL from './queryCtrl'
import encryptPassword from './../../util/encryption'
import errHandler from '../../util/errHandler'
import utilityMethods from '../../util/utilityMethod'

/*________________________________________________________________________
 * @Date        :   15 Feb,2017
 * Modified On  :	26 Feb,2017 (Mansi Teharia)
 * @Author      :   Abhishek verma
 * @Purpose     :   This function is used for creating Default User.
 _________________________________________________________________________
*/
const createDefaultUser = async (req, res) => {
    req.body = {
        'email'         :   'admin@yopmail.com',
        'password'      :   'admin123',
        'name'          :   'Door',
        'companyName'   :   'DOOR',
        'accountType'   :   'door',
        'country'       :   '5a8fc349a0e5285720519823',
        'phone'         :   7845278452,
        'royaltyFeeStatus': 'yes',
        'belongsTo'     :   'doorNetwork',
        'designation'   :   'door'
    }
    let response = await QUERYCTRL.saveData(req, res, User)
    if (response)
        res.send(CONSTANTS.getSaveMessage(response));
}

/*________________________________________________________________________
 * @Date        :   15 Feb,2017
 * Modified On  :
 * @Author      :   Abhishek verma
 * @Purpose     :   This function is used for get data from Excel(demo).
 _________________________________________________________________________
*/
const getExeceldata = async (req,res) => {
    // var obj = xlsx.parse(__dirname + '/sample.xlsx'); // parses a file
    var obj = xlsx.parse(fs.readFileSync(__dirname + '/sample.xlsx'));
    res.send(obj)
}

/*________________________________________________________________________
 * @Date        :  	08 Feb,2017
 * Modified On  :	23 Feb,2017(Mansi Teharia)
 * @Author      :   Abhishek verma
 * @Purpose     :  	This function is used for User CRUD.
 _________________________________________________________________________
*/
const addUser = async (req,res) => {
    console.log(req);
    req.body = UTILITY.utilityMethod(req.body)
    if (req.body.accountType == CONSTANTS.DOOR)
        return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.DATA.INVALID_ACCOUNT_TYPE, error: { accountType: CONSTANTS.DATA.INVALID_ENUM} })
    if (!CONSTANTS.PATTERN.PASSWORD.test(req.body.password))
        return res.send(errHandler({name:'passwordValidationError'}))
    let response = await QUERYCTRL.saveData(req, res, User)
    if (response) {
        res.send(CONSTANTS.getSaveMessage(response, 'Partner'))
        Mail.addPartnerMail(req.body)
    }
}

const getUser = async (req, res) => {
    let { type, id }= req.params,
        query       = {},
        projection  = { __v: 0, password:0, resetPasswordExpires: 0, resetPasswordToken: 0, isDeleted: 0, verifyEmail:0,},
        populateObj = [true, 'country', ['currencyCode','name','code']];
    if (type && id)
        query = { accountType: type, _id: id }
    else{
        if (type)
            query = { accountType: type}
    }
    let response =  await QUERYCTRL.getData(req, res, User, query, projection, populateObj)
    if(response)
        res.send(CONSTANTS.getDataMessage(response))
}

const updateUser = async (req, res) => {
    req.body  = UTILITY.utilityMethod(req.body)
    let { type, id }= req.params,
        data = [],
        password = req.body.password ? req.body.password : '',
        query       = { accountType: type, _id: id },
        response;

    if(req.body.password){
        let validatePassword = CONSTANTS.PATTERN.PASSWORD.test(req.body.password)
        if(!validatePassword)
            return res.send(errHandler({name:'customValidationError'}));
            
        data =  await QUERYCTRL.getData(req, res, User, query)
        req.body.password = await encryptPassword(req.body.password)
    }
    if(data)
        response    = await QUERYCTRL.updateData(req, res, User, query)
    if(response){
        (data.length && data[0].status) ? Mail.passwordConfirmationMail(password, data[0]) : '';
        res.send(CONSTANTS.getUpdateMessage(response))
    }
}

const deleteUser = async (req, res) => {
    let query       = { accountType: req.params.type, _id: req.params.id },
        response    = await QUERYCTRL.deleteData(req, res, User, query)
    if(response)
        res.send(CONSTANTS.getDeleteMessage(response))
}

/*________________________________________________________________________
 * @Date        :   08 Feb,2017
 * Modified On  :	15 Feb,2017
 * @Author      :   Abhishek verma
 * @Purpose     :   This function is used for Country CRUD.
 _________________________________________________________________________
*/
const addCountry = async (req,res) => {
    // debugger
    let response = await QUERYCTRL.saveData(req, res, Country)
    if(response)
        res.send(CONSTANTS.getSaveMessage(response, 'Country'));
}

const getCountry =  async (req, res) => {
    let id          = req.params.id,
        query       = {},
        projection  = { __v: 0 };
    if(id){
        query = {_id:id}
    }
    let response = await QUERYCTRL.getData(req, res, Country, query, projection)
    if(response)
        res.send(CONSTANTS.getDataMessage(response))
}

const updateCountry = async (req, res) => {
    let id          = req.params.id,
        query       = { _id: id },
        response    = await QUERYCTRL.updateData(req, res, Country, query)
    if(response)
        res.send(CONSTANTS.getUpdateMessage(response))
}

const deleteCountry =  async (req, res) => {
    let query       = { _id: req.params.id },
        response    = await QUERYCTRL.deleteData(req, res, Country, query)
    if(response)
        res.send(CONSTANTS.getDeleteMessage(response))
}

/*________________________________________________________________________
 * @Date        :   21 Feb,2018
 * Modified On  :	07 Mar, 2018
 * @Author      :   Mansi Teharia
 * @Purpose     :   This function is used to add royalty fees type A.
 _________________________________________________________________________
*/
const addRoyaltyFeesTypeA = async (req, res) => {
    let componentsArray, start, end, valueArr, isDuplicate,
        { startMonth, startYear, endMonth, endYear, components } = req.body;
    componentsArray = components ? components : []
    valueArr = componentsArray.map(item => item.name);
    isDuplicate = valueArr.some( (item, index) => {
        return valueArr.indexOf(item) != index
    });
    if (isDuplicate)
        return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.DUPLICATE })

    let data = await QUERYCTRL.getData(req, res, RoyaltyFeesTypeA)
    start = startMonth + 1 + (startYear - 2018) * 12
    end = endMonth + 1 + (endYear - 2018) * 12
    if (start > end)
        return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.INVALID_DATE })

    let check = UTILITY.isLieInRange(data, start, end, req);
    if (check) {
        let response = await QUERYCTRL.saveData(req, res, RoyaltyFeesTypeA)
        if (response)
            res.send(CONSTANTS.getSaveMessage(response, 'Royalty Fee'));
    }
    else {
        res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.ALREADY_ACTIVE })
    }
}

const getRoyaltyFeesTypeA =  async (req, res) => {
    let id          = req.params.id,
        query       = {},
        projection  = { __v: 0 };
    id ? query = { _id: id } : query
    let response = await QUERYCTRL.getData(req, res, RoyaltyFeesTypeA, query, projection,false,false,{status:-1})
    if(response)
        res.send(CONSTANTS.getDataMessage(response))
}

const updateRoyaltyFeesTypeA = async (req, res) => {
    let id = req.params.id, start, end, isValid = false,
        query = { _id: id };
    let data = await QUERYCTRL.getData(req, res, RoyaltyFeesTypeA)
    for (let i = 0; i < data.length; i++) {
        if (data[i]._doc._id == id) {
            isValid = true
            start = data[i]._doc.startMonth + 1 + (data[i]._doc.startYear - 2018) * 12
            end = data[i]._doc.endMonth + 1 + (data[i]._doc.endYear - 2018) * 12
            if ((req.body.startMonth != data[i]._doc.startMonth) || (req.body.startYear != data[i]._doc.startYear) || (req.body.endMonth != data[i]._doc.endMonth) || (req.body.endYear != data[i]._doc.endYear)) {
                return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.CANNOT_UPDATE_DATE })
            }
        }
        req.body.components = data[i]._doc.components
    }
    if (!isValid) {
        return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.INVALID_ID })
    }
    let check = UTILITY.isLieInRange(data, start, end, req);
    if (check || (req.body.status == "false" || (req.body.status == false))) {
        let response = await QUERYCTRL.updateData(req, res, RoyaltyFeesTypeA, query)
        if (response)
            res.send(CONSTANTS.getUpdateMessage(response))
    }
    else if (!(check && req.body.status == true)) {
        res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.ALREADY_ACTIVE })
    }
    else
        res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.STATUS_ONLY })
}


const deleteRoyaltyFeesTypeA =  async (req, res) => {
    let query       = { _id: req.params.id },
        response    = await QUERYCTRL.deleteData(req, res, RoyaltyFeesTypeA, query)
    if(response)
        res.send(CONSTANTS.getDeleteMessage(response))
}


/*________________________________________________________________________
 * @Date        :   07 March,2018
 * Modified On  :	-
 * @Author      :   Mansi Teharia
 * @Purpose     :   To update door status of report.
 _________________________________________________________________________
*/
const changeDoorStatus = async (req, res) => {
    let id = req.params.id
    if (req.body.doorStatus) {
        if (!((req.body.doorStatus == 'approved') || (req.body.doorStatus == 'rejected'))) {
            return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.INVALID_ENUM })
        }
        let response = await QUERYCTRL.findIdAndUpdate(Report, id, req, res)
        if (response)
            res.send({ status: HttpStatus.OK, message: `Report ${req.body.doorStatus} successfully` })
    }
    else {
        res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.DOOR_STATUS_ONLY })
    }
}




/* ==================================FILTER ==================================*/
const royaltyFeeFilter = async (req, res) => {
    console.log(req.body)
    if(utilityMethods.checkRequiredParams(req.body, ['status'], res)){
        let { month, year } = req.body;
        let query       = {},
            data        = {},
            currentYear = new Date().getFullYear(),
            check       = (month?parseInt(month):0) + parseInt(year) * 12,
            resultData  = [];
        if (typeof (req.body.status) === "boolean"){
            query = { status: req.body.status }
        }
        let response = await QUERYCTRL.getData(data, res, RoyaltyFeesTypeA, query);
        if (response) {
            if(year){
                for (let response of response) {
                    let start = (month?response.startMonth:0) + response.startYear * 12,
                        end = (month ?response.endMonth:0) + response.endYear * 12;
                    if (check >= start && check <= end) {
                        resultData.push(response)
                    }
                }
                return res.send(CONSTANTS.getDataMessage(resultData))
            }
            else
                return res.send(CONSTANTS.getDataMessage(response))
        }
    }
}

let admin = {
    createDefaultUser,
    getExeceldata,
    addUser,
    getUser,
    deleteUser,
    updateUser,
    addCountry,
    getCountry,
    deleteCountry,
    updateCountry,
    addRoyaltyFeesTypeA,
    getRoyaltyFeesTypeA,
    updateRoyaltyFeesTypeA,
    deleteRoyaltyFeesTypeA,
    changeDoorStatus,
    royaltyFeeFilter
};

export default admin;