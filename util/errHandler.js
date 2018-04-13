import CONSTANTS from '../util/constants'
import HttpStatus from 'http-status-codes'

const errMessage = function (err) {
    let errMsg = {},
        obj = {};
    errMsg['message'] = CONSTANTS.FILLALLFIELDS;
    if (err.name == 'ValidationError') {
        for (let field in err.errors) {
            let key = err.errors[field].path;
            // let key = err.errors[field].path.charAt(0).toUpperCase() + err.errors[field].path.slice(1);
            let val;
            if (err.errors[field].properties && err.errors[field].properties.type){
                if (err.errors[field].properties.type == 'required'){
                    val = (key == 'email' ? 'Email Id' : key.charAt(0).toUpperCase() + key.slice(1)) + ' is ' + err.errors[field].kind + '.';
                }
                else if (err.errors[field].properties.type == 'unique') {
                    // val = key + ' has been already taken.';
                    val = (key == 'email' ? 'Email Id' : key.charAt(0).toUpperCase() + key.slice(1)) + ' already exists.';
                    errMsg['message'] = val;
                }
                else{
                    val = err.errors[field].message;
                }
            }
            else if (err.errors[field].kind == "ObjectID"){
                val = 'Invalid ' + key + ' id.';
            }    
            else 
                val = err.errors[field].message;
            obj[key] = val;
        }
    }
    else if( err.name == 'customRequiredCheck'){
        for( let i = 0; i < err.values.length ; i++) {
            let val = err.values[i] + ' is required.';
            obj[err.values[i]] = val;
        }
    }
    else if (err.name == 'passwordValidationError')
        obj = { password : 'Password is not valid.'}; 
    else if (err.name == 'MongoError'){
        let msg = err.message
        if (msg.includes("dup key")){
            msg = msg.substring(msg.indexOf('$') + 1);
            msg = msg.substring(0, msg.indexOf('_'));
            msg = msg.charAt(0).toUpperCase() + msg.slice(1);
            errMsg['message'] = msg + ' has been already taken.';
            obj[msg] = msg + ' has been already taken.'
        }
        else{
            obj = err;
        }
    }
    else if (err.name == 'CastError' && err.path == '_id') 
        obj[err.path] = 'Invalid id.';
    else
        obj = err;

    errMsg['status'] = HttpStatus.NOT_FOUND;
    errMsg['error'] = obj;
    return errMsg;
}

export default errMessage