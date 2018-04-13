import HttpStatus from 'http-status-codes'
import bcrypt from 'bcrypt';

const FILLALLFIELDS =  "Please Provide All Details.";
const NO_DATA_FOUND = "No Data found.";
const UNAUTHORIZED  = "Sorry, you are not authorised to access this url."
const SALT_WORK_FACTOR = 10;
const DOOR = 'door';
const PARTNER = 'partner';
const PIL = 'pil';
const YES = 'yes';
const NO = 'no';
// const BASE_PATH = "https://doorbackend.herokuapp.com";
const BASE_PATH = "http://180.151.103.85:4000";
const EXCEL_BASE_PATH = BASE_PATH + '/excel/';
const SAMPLE_EXCEL_BASE_PATH = BASE_PATH + '/sample/';
const FRONTEND_BASE_PATH = "http://site4demo.com/door_testing/dist/#/";
const RESET_PASSWORD_PATH = FRONTEND_BASE_PATH + "reset-password/";

const DATA = {
    "Add"       : " added successfully.",
    "FOUND"     : "Data found successfully.",
    "NOT_FOUND" : "No Data found.",
    "SAVE"      : "Data save successfully.",
    "DELETE"    : "Data deleted successfully.",
    "UPDATE"    : "Data updated successfully.",
    "NO_FILE"   : "No File Uploaded.",
    "INVALID_ENUM": "This is not a valid enum.",
    "STATUS_REQUIRED": "Status is required.",
    "DOOR_STATUS_REQUIRED": "Door Status is required.",
    "INVALID_ACCOUNT_TYPE": "Invalid account type."
}
const REPORT = {
    "ALREADY_APPROVED" : "Report is already approved."
}
const JWT = {
    "SECRET_KEY"    : "door_abhishek",
    "EXPIRY_TIME"   : Date.now() + (60 * 60 * 1000),
}

const LOGIN = {
    "REQUIRED"          : "Please Provide All Details.",
    "SUCCESS"           : "Login successful.",
    "INVALID_EMAIL"     : "Enter valid email.",
    "INVALID_PASSWORD"  : "Enter valid password.",
    "DEACTIVATED"       : "Your account is currently deactivated. Please contact to DOOR."
}

const LOGOUT = {
    "SUCCESS"   : "Logout successful.",
    "NOT_FOUND" : "Already logout."
}

const PASSWORD = {
    "REQUIRED"              : "Please provide all valid details.",
    "INVALID_EMAIL"         : "Enter valid email.",
    "SUCCESS"               : "Password has been successfully updated.",
    "INCORRECT"             : "Incorrect old password.",
    "MISMATCHED"            : "Confirm password mismatched.",
    "SAME"                  : "Old password & new password can't be same.",
    "SENT_EMAIL"            : "Email sent successfully.",
    "EXPIRED"               : "Invalid URL.",
    "RESET_PASSWORD_EXPIRY" :  Date.now() + 3600000 
}

const GMAIL_SMTP_CREDENTIAL = {
    "TYPE"      : "SMTP",
    "SERVICE"   : "Gmail",
    "HOST"      : "smtp.gmail.com",
    "PORT"      : 587,
    "SECURE"    : true,
    "USERNAME"  : "door.wildnet@gmail.com",
    "PASSWORD"  : "wildnet@123",
}

const PATTERN = {
    "PASSWORD"    : /(?=.*[A-Za-z])[a-zA-Z\d$@$!%*#?&]{6,10}/
}

const MAIL = {
    "ADD_PARTNER"       : "Welcome to DOOR International",
    "CONFIRMATION_MAIL" : "Confirmation Mail",
    "RESET_PASSWORD"    : "Reset Password",
    "UPDATE_REPORT"     : "Report Updated"
}

const ROYALTY_FEE = {

    "ALREADY_ACTIVE"    : "This period is already active.",
    "DOOR_STATUS_ONLY"  : "Please update door status only.",
    "STATUS_ONLY"       : "Please update status only.",
    "INVALID_ENUM"      : "This is not a valid enum.",
    "NO_ROYALTY"        : "No royalty is added, please contact to door or select some other period.",
    "CANNOT_UPDATE_DATE": "Start or End Date can't be update.",
    "DUPLICATE"         : "Duplicate royalty name not allowed.",
    "INVALID_DATE"      : "Start Date can't be less than End Date.",
    "INVALID_ID"        : "Invalid id."
}

const PIL_ROYALTY_FEE = {

    "ALREADY_ACTIVE"            : "Already PIL Active, Deactive it first.",
    "PIL_STATUS_ONLY"           : "Please update door status only.",
    "STATUS_ONLY"               : "Please update status only.",
    "INVALID_ENUM"              : "This is not a valid enum.",
    "NO_PIL_ROYALTY"            : "No PIL royalty is added, please contact to door or select some other period.",
    "CANNOT_UPDATE_STATUS"      : "This record is already active",
    "DUPLICATE"                 : "Duplicate pil royalty name not allowed.",
    "INVALID_DATE"              : "Start Date can't be less than End Date.",
    "INVALID_ID"                : "Invalid id."
}

const monthName = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const setExcelStyle = (fontColor, fontSize, isBold, bgColor, align="center", numFormat) => {
    return {
        font: {
            color: {
                rgb: fontColor
            },
            sz      : fontSize,
            bold    : isBold,
            underline: false
        },
        numFmt: numFormat,
        fill: {
            fgColor: {
                rgb: bgColor
                // rgb: '0071b342'
            }
        },
        alignment: {
            wrapText    : true,
            horizontal  : align,
            vertical    : "center"
        },
        border: {
            top     : { style: "thin", color: "FFFF0000" },
            bottom  : { style: "thin", color: "FFFF0000" },
            left    : { style: "thin", color: "FFFF0000" },
            right   : { style: "thin", color: "FFFF0000" }
        }
    }
}

const getSaveMessage = (data, model) => {
    if(model){
        return { message: model + DATA.Add, status: HttpStatus.OK }    
    }
    else{
        return { message: DATA.SAVE, status: HttpStatus.OK }
    }
}

const getDataMessage = data => {
    if (data.length)
        return { message: DATA.FOUND, data: data, status: HttpStatus.OK }
    else
        return { message: DATA.NOT_FOUND, data: data, status: HttpStatus.OK }
}

const getUpdateMessage = data => {
    if (data.n)
        return { message: DATA.UPDATE, status: HttpStatus.OK }
    else
        return { message: DATA.NOT_FOUND, status: HttpStatus.NOT_FOUND }
}

const getFindUpdateMessage = () => {
    return { message: DATA.UPDATE, status: HttpStatus.OK }
}

const getDeleteMessage = data => {
    if (data.result.n)
        return { message: DATA.DELETE, status: HttpStatus.OK }
    else
        return { message: DATA.NOT_FOUND, status: HttpStatus.NOT_FOUND }
}

const getLoginMessage = (data, token) => {
    if (data){
        let { _id, email, accountType, avatar, belongsTo, name, country, royaltyFeeStatus } = data._doc,
            resData = { _id, email, name, accountType, avatar, token, belongsTo, country, royaltyFeeStatus };
        return { message: LOGIN.SUCCESS, data: resData, status: HttpStatus.OK }
    }
    else
        return { message: DATA.NOT_FOUND, status: HttpStatus.NOT_FOUND }
}

const getLoginErrorMessage = response => {
    if(response && !response.status)
        return {message : LOGIN.DEACTIVATED,status:HttpStatus.NOT_FOUND }
    else 
        return { message : LOGIN.INVALID_EMAIL,status:HttpStatus.NOT_FOUND }
}

var constants = {
    BASE_PATH ,
    EXCEL_BASE_PATH,
    SAMPLE_EXCEL_BASE_PATH,
    FRONTEND_BASE_PATH,
    RESET_PASSWORD_PATH,
    SALT_WORK_FACTOR,
    FILLALLFIELDS,
    DATA,
    REPORT,
    NO_DATA_FOUND,
    UNAUTHORIZED,
    JWT,
    LOGIN,
    LOGOUT,
    PASSWORD,
    GMAIL_SMTP_CREDENTIAL,
    PATTERN,
    MAIL,
    DOOR,
    PARTNER,
    PIL,
    ROYALTY_FEE,
    PIL_ROYALTY_FEE,
    YES,
    NO,
    monthName,
    setExcelStyle,
    getSaveMessage,
    getDataMessage,
    getUpdateMessage,
    getFindUpdateMessage,
    getDeleteMessage,
    getLoginMessage,
    getLoginErrorMessage
};

module.exports = constants;