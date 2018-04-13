import errHandler from './errHandler'
import RoyaltyFeesTypeA from './../app/models/royaltyFeesTypeA'
import QUERYCTRL from './../app/controllers/queryCtrl'
import CONSTANTS from './constants'
import User from './../app/models/users'

const utilityMethod = data => {
    let fields = Object.keys(data)
    for( let i=0 ; i<fields.length ; i++ ){
        switch(fields[i]){
            case 'name': data.name = data.name.replace(/\w\S*/g, (txt => txt[0].toUpperCase() + txt.substr(1).toLowerCase()))
                break;
            case 'customer': data.customer = data.customer.replace(/\w\S*/g, (txt => txt[0].toUpperCase() + txt.substr(1).toLowerCase()))
                break;
            case 'email' : data.email = data.email.toLowerCase()
                break;
            case 'code'   : data.code = data.code.toUpperCase()
                break;
            case 'currencyCode': data.currencyCode = data.currencyCode.toUpperCase()
                break;
            case 'currency_code': data.currency_code = data.currency_code.toUpperCase()
                break;
        }
    }
    return data
}

const checkRequiredParams = (data, requiredParams, res) => {
    let fields = Object.keys(data),
        check = [];

    for (let param of requiredParams) {
        let val = (fields.includes(param))
        if (!val)
            check.push(param)
    }
    if (check.length) {
        res.send(errHandler({ name: 'customRequiredCheck', values: check }));
        return false;
    }
    else
        return true;
}

const isLieInRange = (data, start, end, req) => {
    let status = true,
        currentYear = new Date().getFullYear()
    for (let i = 0; i < data.length; i++) {
        let checkStart = data[i]._doc.startMonth + 1 + (data[i]._doc.startYear - currentYear) * 12
        let checkEnd = data[i]._doc.endMonth + 1 + (data[i]._doc.endYear - currentYear) * 12
        if (data[i]._doc.status == true) {
            if (!((checkStart > start && checkStart > end) || (checkEnd < start && checkEnd < end))) {
                return false
            }
        }
    }
    return status
}

const getRoyaltyFee = async (month, year, res) => {
    let query = {},
        req = {},
        currentYear = new Date().getFullYear(),
        check = parseInt(month) + 1 + (parseInt(year) - currentYear) * 12,
        response = await QUERYCTRL.getData(req, res, RoyaltyFeesTypeA, query)
    if (response) {
        for (let i = 0; i < response.length; i++) {
            if (response[i].status) {
                let start = response[i].startMonth + 1 + (response[i].startYear - currentYear) * 12
                let end = response[i].endMonth + 1 + (response[i].endYear - currentYear) * 12
                if ((check > start && check < end) || check == start || check == end) {
                    return response[i].components
                }
            }
        }
    }
}

const getAdminEmail = async () => {
    try {
        let query = { accountType: CONSTANTS.DOOR},
            projection = { email:1 },
            response = await User.find(query, projection)
        if (response){
            return response
        }
    }
    catch (error) {
        console.log(error)
        return false
    }
}

let utilityMethods = {
    utilityMethod,
    checkRequiredParams,
    isLieInRange,
    getRoyaltyFee,
    getAdminEmail
};

export default utilityMethods;0