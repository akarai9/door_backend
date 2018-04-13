import bcrypt from 'bcrypt';
import CONSTANTS from './constants'

const encryptPassword = async (data) => {
    let salt = await bcrypt.genSalt(CONSTANTS.SALT_WORK_FACTOR)
    if(salt){
        let hash = await bcrypt.hash(data, salt)
        if(hash) {
            return hash;
        }
        else
            return err;
    }
    else 
        return err;
}

export default encryptPassword; 