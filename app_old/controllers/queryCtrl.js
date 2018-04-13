import CONSTANTS from '../../util/constants'
import errHandler from '../../util/errHandler'
import HttpStatus from 'http-status-codes';
import bcrypt from 'bcrypt';

const saveData = async (req, res, MODEL) => {
    try {
        let response = await MODEL(req.body).save()
        return response
    }
    catch (error) {
        // res.send(error)
        res.send(errHandler(error))
        return false
    }
}

const getData = async (req, res, MODEL, query, projection, populateObj1, populateObj2, sortObj ) => {
    // populateObj[0] for status 
    // populateObj[1] for path
    // populateObj[2] for select Array
    try {
        let response;
        if (populateObj1){
            response = await MODEL.find(query, projection).populate(populateObj1[1], populateObj1[2])
        }
        else if (populateObj2){
            response = await MODEL.find(query, projection).populate(populateObj1[1], populateObj1[2]).populate(populateObj2[1], populateObj2[2])
        }
        else{
            response = await MODEL.find(query, projection).sort(sortObj)
        }
        return response
    }
    catch (error) {
        res.send(errHandler(error))
        // res.send(error)
        return false
    }
}

const getOnedata = async (req, res, MODEL, query, projection) => {
    try {
        let response = await MODEL.findOne(query, projection)
        return response
    }
    catch (error) {
        res.send(errHandler(error))
        return false
    }
}

const updateData = async (req, res, MODEL, query) => {
    try {
        let response = await MODEL.updateOne(query, req.body)
        return response
    }
    catch (error) {
        res.send(errHandler(error))
        return false
    }
}

/* Not used yet  */
const findAndUpdateData = async (req, res, MODEL, query) =>{
    try {
        let response = await MODEL.findOneAndUpdate(query, req.body, { "new": true }).populate('partnerId')
        return response
    }
    catch (error) {
        res.send(errHandler(error))
        return false
    }
}

// const updateFee = async (req, res, MODEL, query) => {
//     try {
//         let response = MODEL.update(
//             query,
//             { $push: req.body },
//         );
//         return response
//     }
//     catch (error) {
//         res.send(errHandler(error))
//         return false
//     }
// }

const lastInsert = async (req, res, MODEL) => {
    try {
        let count = await MODEL.count();
        let response = await MODEL.find().skip(count - 1)
        return response
    }
    catch (error) {
        res.send(errHandler(error))
        return false
    }
}

const deleteData = async (req, res, MODEL, query) => {
    try {
        let response = await MODEL.remove(query)
        return response
    }
    catch (error) {
        res.send(errHandler(error))
        return false
    }
}

const totalCount = async (req, res, Model, query) => {
    try {
        let response = await Model.count(query)
        return response
    }
    catch (error) {
        res.send(errHandler(error))
        return false
    }
}

const findLastEntry = async(Model, query) => {
    try {
        let response = await Model.find().sort(query);
        return response
    }
    catch(error){
        res.send(errHandler(error))
        return false
    }
}

const findIdAndUpdate = async(Model, id, req, res) => {
    try {
        let response = await Model.findByIdAndUpdate(id, { $set: req.body }, { new: true })
        return response
    }
    catch (error) {
        res.send(errHandler(error))
        return false
    }
}


let queryFun = {
    saveData,
    getData,
    updateData,
    deleteData,
    getOnedata,
    totalCount,
    findLastEntry,
    findIdAndUpdate,
    findAndUpdateData
    // updateFee
}

export default queryFun;