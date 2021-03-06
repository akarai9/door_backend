import HttpStatus from 'http-status-codes'
import fs, { Stats } from 'fs';
import xlsx from 'node-xlsx';
import newExcel from 'node-excel-export'
import path from 'path'
// import multer from 'multer'

import UTILITY from '../../util/utilityMethod'
import RoyaltyFeesTypeA from '../models/royaltyFeesTypeA'
import PilRoyaltyFeeTypeB from '../models/pilRoyaltyFeesTypeB'
import PilReport from '../models/pilReport'
import utilityMethods from '../../util/utilityMethod'
import User from './../models/users'
import QUERYCTRL from './queryCtrl'
import Facilitator from '../models/facilitator'
import Report from '../models/monthlyReport'
import Country from '../models/country'
import CONSTANTS from '../../util/constants'
import errHandler from '../../util/errHandler'
import utilityMethod from '../../util/utilityMethod';
import EXCEL_UTIL from '../../util/excel';
import Mail from './SendMail.js';

/*________________________________________________________________________
 * @Date        :   21 Feb,2018
 * Modified On  :	21 Feb,2018
 * @Author      :   Mansi Teharia
 * @Purpose     :   This function is used for Facilitator CRUD.
 _________________________________________________________________________
*/
const addFacilitator = async (req, res) => {
    let query = { _id: -1 }
    req.body = UTILITY.utilityMethod(req.body)
    let lastEntry = await QUERYCTRL.findLastEntry(Facilitator, query)
    if (lastEntry) {
        req.body.uuid = lastEntry.length ? "fac_" + (parseInt(lastEntry[0].uuid.replace("fac_", "")) + 1) : "fac_0"
        let decodedToken = res.locals.decodedToken;
        req.body.partnerId = decodedToken.accountType == CONSTANTS.DOOR ? req.body.partnerId : decodedToken._id;
        let response = await QUERYCTRL.saveData(req, res, Facilitator)
        if (response) {
            res.send(CONSTANTS.getSaveMessage(response, 'Facilitator'));
        }
    }
}

const getFacilitator = async (req, res) => {
    let id = req.params.id,
        decodedToken = res.locals.decodedToken,
        query = {},
        projection = { __v: 0 },
        populateObj = [true, 'partnerId', ['email', 'firstName', 'avatar', 'name']];
    id ? query._id = id : query;
    decodedToken.accountType == CONSTANTS.DOOR ? query : query.partnerId = decodedToken._id;
    let response = await QUERYCTRL.getData(req, res, Facilitator, query, projection, populateObj)
    if (response) {
        res.send(CONSTANTS.getDataMessage(response))
    }
}

const updateFacilitator = async (req, res) => {
    let id = req.params.id,
        query = { _id: id },
        response = await QUERYCTRL.updateData(req, res, Facilitator, query)
    req.body = UTILITY.utilityMethod(req.body)
    if (response)
        res.send(CONSTANTS.getUpdateMessage(response))
}

const deleteFacilitator = async (req, res) => {
    let query = { _id: req.params.id },
        response = await QUERYCTRL.deleteData(req, res, Facilitator, query)
    if (response)
        res.send(CONSTANTS.getDeleteMessage(response))
}

/*________________________________________________________________________
 * @Date        :   22 Feb,2018
 * Modified On  :	06.03.2018 ( Mansi Teharia )
 * @Author      :   Abhishek Verma
 * @Purpose     :   This function is used for CRUD Monthly Report.
 _________________________________________________________________________
*/
const addReport = async (req, res) => {
    let requiredParams = ['month', 'year', 'local_currency', 'eur_x_rate', 'usd_x_rate']
    let decodedToken = res.locals.decodedToken,
        alreadyAdded = false,
        user = await QUERYCTRL.getData(req, res, User, { _id: decodedToken._id }),
        response = await QUERYCTRL.getData(req, res, Report, { partnerId: decodedToken._id });
    if (response) {
        let monthYearObj = [];
        for (let report of response) {
            if ((parseInt(req.body.month) == report.month) && (parseInt(req.body.year) == report.year)) {
                alreadyAdded = true
            }
        }
        if (alreadyAdded) {
            return res.send({ status: HttpStatus.NOT_FOUND, message: `Report is already added for ${CONSTANTS.monthName[parseInt(req.body.month)]}, ${parseInt(req.body.year)}, please check in Drafted/Shared report section at home screen.` })
        }
        if (utilityMethods.checkRequiredParams(req.body, requiredParams, res)) {
            let component = await UTILITY.getRoyaltyFee(req.body.month, req.body.year, res);
            if (user) {
                if (user[0].royaltyFeeStatus == "no")
                    req.body.royaltyArray = component;
                else
                    req.body.royaltyArray = [];
                req.body.partnerId = res.locals.decodedToken._id
                if (component) {
                    req.body.status = "drafted"
                    req.body.doorStatus = "pending"
                    req.body.doorComment = []
                    let response = await QUERYCTRL.saveData(req, res, Report)
                    if (response) {
                        let sendResponse = CONSTANTS.getSaveMessage(response, 'Report')
                        sendResponse['data'] = [{ id: response._id }]
                        res.send(sendResponse);
                    }
                }
                else {
                    return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.NO_ROYALTY })
                }
            }
        }
    }
}

const getReport = async (req, res) => {
    let id = req.params.id,
        query = {},
        populateObj = [true, 'partnerId', ['name', 'belongsTo', 'country']],
        decodedToken = res.locals.decodedToken,
        projection = { __v: 0 },
        response;
    id ? query._id = id : query;

    if (decodedToken.accountType == CONSTANTS.DOOR)
        query.$or = [{ status: 'shared' }, { status: 'resubmitted' }]
    else
        query.partnerId = decodedToken._id;

    response = await QUERYCTRL.getData(req, res, Report, query, projection, populateObj)
    if (response)
        res.send(CONSTANTS.getDataMessage(response))
}

const updateReport = async (req, res) => {
    let accountType = res.locals.decodedToken.accountType,
        query = { _id: req.params.id },
        data = { body: {} },
        msgObj,
        response = await QUERYCTRL.getData(req, res, Report, query),
        requestBody = req.body,
        invalidDoorStatus = !(['approved', 'rejected', 'pending', 'resubmitted'].includes(requestBody.doorStatus)),
        invalidStatus = !(['drafted', 'shared', 'resubmitted'].includes(requestBody.status));

    if (accountType == CONSTANTS.DOOR) {
        if (invalidDoorStatus) {
            msgObj = { doorStatus: req.body.doorStatus ? CONSTANTS.DATA.INVALID_ENUM : CONSTANTS.DATA.DOOR_STATUS_REQUIRED }
            return res.send({ status: HttpStatus.NOT_FOUND, message: msgObj.doorStatus, error: msgObj })
        } else {
            data.body.doorStatus = requestBody.doorStatus;
            data.body.$push = { doorComment: { comment: requestBody.doorComment } };
            let updateResponse = await QUERYCTRL.findAndUpdateData(data, res, Report, query)
            if (updateResponse) {
                Mail.updateReport(updateResponse)
                res.send(CONSTANTS.getFindUpdateMessage())
            }
        }
    }
    else if (accountType == CONSTANTS.PARTNER) {
        if (invalidStatus) {
            msgObj = { status: req.body.status ? CONSTANTS.DATA.INVALID_ENUM : CONSTANTS.DATA.STATUS_REQUIRED }
            return res.send({ status: HttpStatus.NOT_FOUND, message: msgObj.status, error: msgObj })
        } else {
            let condition1 = response && response[0]._doc.doorStatus == 'rejected' && requestBody.status == 'resubmitted',
                condition2 = response && response[0]._doc.doorStatus == 'pending' && (requestBody.status == 'drafted' || requestBody.status == 'shared');
            if (condition1 || condition2) {
                data.body.status = requestBody.status;
                if (condition1)
                    data.body.doorStatus = 'resubmitted';
                response = await QUERYCTRL.updateData(data, res, Report, query)
                if (response)
                    return res.send(CONSTANTS.getUpdateMessage(response))
            }
            else {
                if (response && response[0]._doc.doorStatus == 'approved')
                    msgObj = { status: CONSTANTS.REPORT.ALREADY_APPROVED }
                else
                    msgObj = { status: CONSTANTS.DATA.INVALID_ENUM }
                return res.send({ status: HttpStatus.NOT_FOUND, message: msgObj.status, error: msgObj })
            }
        }
    }
    else {
        return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.UNAUTHORIZED })
    }
}

const deleteReport = async (req, res) => {
    let query = { _id: req.params.id },
        // let query = { },
        response = await QUERYCTRL.deleteData(req, res, Report, query);

    if (response)
        res.send(CONSTANTS.getDeleteMessage(response))
}

/*________________________________________________________________________
 * @Date        :   22 Feb,2018
 * Modified On  :	05.03.2018 (Mansi Teharia)
 * @Author      :   Abhishek Verma
 * @Purpose     :   This function is used for CRUD Clent of Monthly Report.
 _________________________________________________________________________
 */
const getClientDetails = async (req, res) => {
    let reportId = req.params.reportId,
        clientId = req.params.clientId,
        query = {},
        projection = {};
    if (reportId)
        query = { _id: reportId }
    let response = await QUERYCTRL.getData(req, res, Report, query, projection)
    if (response) {
        if (response.length > 0)
            res.send(CONSTANTS.getDataMessage(response))
        else
            res.send(CONSTANTS.getDataMessage([]))
    }
}

const addClientDetails = async (req, res) => {
    let requiredParams = ['customer', 'invoice_number', 'category', 'invoice_amount', 'curriculum_n_Program', 'english_description_of_course', 'number_of_days']
    let reportId = req.params.reportId,
        query = { _id: reportId },
        royaltyValue,
        reportData,
        data,
        projection = { __v: 0 },
        populateObj = [true, 'country', ['name', 'currencyCode']];
    req.body = UTILITY.utilityMethod(req.body)
    reportData = await QUERYCTRL.getData(req, res, Report, query, projection)
    if (reportData) {
        query._id = reportData[0].partnerId
        data = await QUERYCTRL.getData(req, res, User, query, projection, populateObj)
    }
    if (data) {
        let royaltyValueArray = reportData[0]._doc.royaltyArray
        if (royaltyValueArray.length) {
            requiredParams.splice(2, 0, 'royalty')
        }
        if (utilityMethods.checkRequiredParams(req.body, requiredParams, res)) {
            if (royaltyValueArray.length > 0) {
                let isRoyaltyFee = false
                for (let royalty of royaltyValueArray) {
                    if (royalty.name.toLowerCase() == req.body.royalty.toLowerCase()) {
                        // req.body.royalty = royalty.name
                        req.body.royalty = royalty.name + " (" + royalty.amount + "%)"
                        royaltyValue = +royalty.amount
                        isRoyaltyFee = true
                        break
                    }
                }
                if (!isRoyaltyFee) {
                    return res.send({ data: [], status: HttpStatus.NOT_FOUND, message: `Invalid Royalty (${req.body.royalty}) for ${CONSTANTS.monthName[reportData[0]._doc.month]}, ${reportData[0]._doc.year}.` })
                }
            }
            req.body.country = data[0].country.name
            req.body.currency_code = data[0].country.currencyCode
            req.body.xrate_eur = reportData[0].eur_x_rate
            req.body.xrate_usd = reportData[0].usd_x_rate
            req.body.total_amount_in_usd = req.body.xrate_usd * req.body.invoice_amount
            req.body.total_amount_in_eur = req.body.xrate_eur * req.body.invoice_amount
            if (royaltyValueArray.length) {
                req.body.royalty_due_in_eur = req.body.total_amount_in_eur * royaltyValue / 100
                req.body.royalty_due_in_usd = req.body.total_amount_in_usd * royaltyValue / 100
            }
            Report.findByIdAndUpdate(
                { _id: reportId },
                { $push: { "client_details": req.body } },
                { safe: true, upsert: true },
                (err, model) => {
                    if (err) {
                        return res.send(err);
                    }
                    return res.send(CONSTANTS.getSaveMessage(['found'], 'Client'));
                }
            );
        }
    }
}

const updateClientDetails = async (req, res) => {
    let reportId = req.params.reportId,
        clientId = req.params.clientId,
        royaltyValue,
        data,
        reportData,
        query = { _id: reportId },
        projection = { __v: 0 },
        populateObj = [true, 'country', ['name', 'currencyCode']];

    let requiredParams = ['customer', 'invoice_number', 'category', 'invoice_amount', 'curriculum_n_Program', 'english_description_of_course', 'number_of_days']

    req.body = UTILITY.utilityMethod(req.body)
    reportData = await QUERYCTRL.getData(req, res, Report, query, projection)
    if (reportData) {
        query._id = reportData[0].partnerId
        data = await QUERYCTRL.getData(req, res, User, query, projection, populateObj)
    }
    if (data) {
        let royaltyValueArray = reportData[0]._doc.royaltyArray
        if (royaltyValueArray.length) {
            requiredParams.splice(2, 0, 'royalty')
        }
        if (utilityMethods.checkRequiredParams(req.body, requiredParams, res)) {
            if (royaltyValueArray.length) {
                let isRoyaltyFee = false
                for (let royaltyArray of royaltyValueArray) {
                    if (royaltyArray.name.toLowerCase() == req.body.royalty.toLowerCase()) {
                        req.body.royalty = royaltyArray.name + " (" + royaltyArray.amount + "%)"
                        royaltyValue = +royaltyArray.amount
                        isRoyaltyFee = true
                        break
                    }
                }
                if (!isRoyaltyFee) {
                    return res.send({ data: [], status: HttpStatus.NOT_FOUND, message: `Invalid Royalty (${req.body.royalty}) for ${CONSTANTS.monthName[reportData[0]._doc.month]}, ${reportData[0]._doc.year}.` })
                }
            }
            req.body.country = data[0].country.name
            req.body.currency_code = data[0].country.currencyCode
            req.body.xrate_eur = reportData[0].eur_x_rate
            req.body.xrate_usd = reportData[0].usd_x_rate
            req.body.total_amount_in_usd = req.body.xrate_usd * req.body.invoice_amount
            req.body.total_amount_in_eur = req.body.xrate_eur * req.body.invoice_amount
            if (royaltyValueArray.length) {
                req.body.royalty_due_in_eur = req.body.total_amount_in_eur * royaltyValue / 100
                req.body.royalty_due_in_usd = req.body.total_amount_in_usd * royaltyValue / 100
            }
            req.body._id = clientId
            Report.update({ 'client_details._id': clientId },
                { $set: { 'client_details.$': req.body } },
                (err, model) => {
                    if (err) {
                        return res.send(errHandler(err));
                    }
                    return res.send(CONSTANTS.getUpdateMessage(model));
                }
            )
        }
    }
}

const deleteClientDetails = async (req, res) => {
    let _id = req.params.reportId;
    let clientId = req.params.clientId;
    Report.findByIdAndUpdate(
        _id,
        { $pull: { 'client_details': { _id: clientId } } },
        (err, model) => {
            if (err) {
                console.log(err);
                return res.send(err);
            }
            return res.send(CONSTANTS.getUpdateMessage({ n: 1 }));
        }
    );
}

/*________________________________________________________________________
 * @Date        :   5 March,2017
 * Modified On  :   -
 * @Author      :   Abhishek verma
 * @Purpose     :   This function is used for get Excel(sample).
 _________________________________________________________________________
*/
const getSampleExcel = async (req, res) => {
    let decodedToken = res.locals.decodedToken,
        data = await QUERYCTRL.getData(req, res, User, { _id: decodedToken._id });
    if (data) {
        let filename = data[0].royaltyFeeStatus == CONSTANTS.NO ? "sample_royalty.xlsx" : "sample_without_royalty.xlsx";
        res.send({ message: CONSTANTS.DATA.FOUND, data: [{ path: CONSTANTS.SAMPLE_EXCEL_BASE_PATH + filename }], status: HttpStatus.OK })
    }
}

/*________________________________________________________________________
 * @Date        :   7 March,2018
 * Modified On  :	-
 * @Author      :   Abhishek Verma
 * @Purpose     :   To get/generate/upload Excel Data.
 _________________________________________________________________________
*/

const uploadExcel = async (req, res) => {
    if (req.files) {
        let jsonData = xlsx.parse(req.files.excel.data);
        res.send(CONSTANTS.getDataMessage(jsonData))
        /* let readStream = fs.createReadStream(path.resolve(".") + "/public/upload.xls")
        readStream.on('data', (data) => {
            res.send(data)
        }) */
    }
    else {
        res.send({ message: CONSTANTS.DATA.NO_FILE, status: HttpStatus.NOT_FOUND })
    }
}
const generateExcelCalculation = async (req, res) => {
    if (req.body.data) {
        let jsonData = req.body.data,
            data,
            reportId = req.params.reportId,
            reportData = await QUERYCTRL.getData(req, res, Report, { _id: reportId });
        if (reportData)
            data = await QUERYCTRL.getData(req, res, User, { _id: reportData[0].partnerId });
        if (data) {
            let royaltyValueArray = reportData[0]._doc.royaltyArray,
                EUR_Xrate = reportData[0]._doc.eur_x_rate,
                USD_Xrate = reportData[0]._doc.usd_x_rate,
                jsonDataHeader = [['Customer', 'Industry', 'Country', 'Invoice number', 'English description of course', 'Number of days', 'Invoice amount', 'Currency code', 'Category', 'Curriculum & Program', 'EUR_Xrate', 'Total amount in EUR', 'USD_Xrate', 'Total amount in USD']];
            for (let data of jsonData) {
                if (data && data[6]) {
                    let total_amount_in_EUR = EUR_Xrate * data[6],
                        total_amount_in_USD = USD_Xrate * data[6];
                    data.push(EUR_Xrate, total_amount_in_EUR, USD_Xrate, total_amount_in_USD)
                    if (data[0] && (royaltyValueArray.length && data[8])) {
                        let royalty = data[8],
                            Royalty_due_in_EUR,
                            Royalty_due_in_USD,
                            isRoyaltyFee = false;
                        for (let royaltyArray of royaltyValueArray) {
                            if (royalty.toLowerCase().includes(royaltyArray.name.toLowerCase())) {
                                data[8] = royaltyArray.name + " (" + royaltyArray.amount + "%)"
                                Royalty_due_in_EUR = (total_amount_in_EUR * royaltyArray.amount) / 100
                                Royalty_due_in_USD = (total_amount_in_USD * royaltyArray.amount) / 100
                                isRoyaltyFee = true
                            }
                        }
                        if (!isRoyaltyFee) {
                            return res.send({ data: [], status: HttpStatus.NOT_FOUND, message: `Invalid Royalty (${royalty}) for ${CONSTANTS.monthName[reportData[0]._doc.month]}, ${reportData[0]._doc.year}.` })
                        }
                        data.push(Royalty_due_in_EUR, Royalty_due_in_USD)
                    }
                }
            }
            if (royaltyValueArray.length) {
                jsonDataHeader[0].splice(8, 0, 'Royalty')
                jsonDataHeader[0].push('Royalty due in EUR', 'Royalty due in USD')
            }
            res.send(CONSTANTS.getDataMessage(jsonDataHeader.concat(jsonData)))
        }
    }
    else {
        res.send({ message: CONSTANTS.DATA.NO_FILE, status: HttpStatus.NOT_FOUND })
    }
}

const addClientDetailsByExcelData = async (req, res) => {
    if (req.body) {
        let jsonData = req.body.data,
            status = req.body.status,
            data = [],
            _id = req.params.reportId,
            excelHeader = ['customer', 'industry', 'country', 'invoice_number', 'english_description_of_course', 'number_of_days', 'invoice_amount', 'currency_code', 'royalty', 'category', 'curriculum_n_program', 'xrate_eur', 'total_amount_in_eur', 'xrate_usd', 'total_amount_in_usd', 'royalty_due_in_eur', 'royalty_due_in_usd']
        if (status == 'shared' || status == "drafted" || status == 'resubmitted') {
            if (status == 'resubmitted') {
                let query = { _id: _id }
                let data = await QUERYCTRL.getData(req, res, Report, query)
                if (data.length && (data[0]._doc.doorStatus != 'rejected' && data[0]._doc.doorStatus != 'resubmitted')) {
                    console.log(data[0]._doc.doorStatus)
                    return res.send({ message: CONSTANTS.DATA.INVALID_ENUM, status: HttpStatus.NOT_FOUND })
                }
            }
            for (let i = 1; i < jsonData.length; i++) {
                let clientDetail = {};
                for (let j = 0; j < excelHeader.length; j++) {
                    clientDetail[excelHeader[j]] = jsonData[i][j] ? jsonData[i][j] : ''
                }
                data.push(clientDetail)
            }
            Report.findByIdAndUpdate(_id, { "status": status, "client_details": data }).populate('partnerId').exec((err, model) => {
                if (err) {
                    return res.send(errHandler(err));
                }
                if (res.locals.decodedToken.accountType == CONSTANTS.DOOR)
                    Mail.updateReport(model, 'modified')
                return res.send(CONSTANTS.getSaveMessage(['found'], 'Client'));
            });
        }
        else
            res.send({ message: CONSTANTS.DATA.INVALID_ENUM, status: HttpStatus.NOT_FOUND })
    }
    else {
        res.send({ message: CONSTANTS.DATA.NO_FILE, status: HttpStatus.NOT_FOUND })
    }
}

const downloadExcelReport = async (req, res) => {
    let reportId = req.params.reportId,
        query = { _id: reportId },
        projection = { __v: 0 },
        populateObj = [true, 'partnerId', ['email', 'name', 'country']],
        userReport = await QUERYCTRL.getData(req, res, Report, query, projection, populateObj);
    if (userReport) {
        if (!req.body.data) {

            return res.send({ message: CONSTANTS.DATA.NO_FILE, status: HttpStatus.NOT_FOUND })
        }
        let jsonData = req.body.data,
            isRoyalty,
            { country, month, year, currency_code } = req.body;

        isRoyalty = (userReport[0].royaltyArray.length ? true : false)

        if (req.files && req.files.excel)
            jsonData = xlsx.parse(req.files.excel.data)[0].data;

        // Generate Report
        const report = newExcel.buildExport(
            [
                {
                    name: 'Report',
                    heading: EXCEL_UTIL.getHeading(country, currency_code, month, year, { name: userReport[0].partnerId.name }),
                    merges: EXCEL_UTIL.getMerge(isRoyalty),
                    specification: EXCEL_UTIL.getSpecification(isRoyalty),
                    data: EXCEL_UTIL.getDataSet(jsonData, country, month, year, isRoyalty)
                }
            ]
        );

        // return res.send(EXCEL_UTIL.getDataSet(jsonData, country, month, year, isRoyalty))
        // Save generated File
        let uniqString = Math.random().toString(36).substring(2, 15),
            filename = `DOOR_${country}_Report_for_${CONSTANTS.monthName[month]}_${year}_${uniqString}.xlsx`,
            basePath = path.resolve(".") + "/public/excel/",
            filePath = basePath + filename;
        fs.writeFile(filePath, report, function (err) {
            if (err) {
                console.log(err);
                return res.send(errHandler(error))
            }
            console.log("The file was saved on location ", filePath)
            res.send({ message: CONSTANTS.DATA.FOUND, data: [{ path: CONSTANTS.EXCEL_BASE_PATH + filename }], status: HttpStatus.OK })
        });
    }
}

/*________________________________________________________________________
 * @Date        :   05 March,2018
 * Modified On  :	-
 * @Author      :   Mansi Teharia
 * @Purpose     :   To get total count.
 _________________________________________________________________________
*/
const getTotalCount = async (req, res) => {
    let query = { accountType: CONSTANTS.PARTNER, status: true },
        statusQuery = {},
        partnerCount,
        reportCountDoor,
        sharedReportCount,
        draftedReportCount,
        pilReportCountDoor,
        pilSharedReportCount,
        pilDraftedReportCount,
        decodedToken = res.locals.decodedToken;

    if (decodedToken.accountType == CONSTANTS.DOOR) {
        partnerCount = await QUERYCTRL.totalCount(req, res, User, query)
        if (partnerCount !== false) {
            statusQuery.$or = [{ status: 'shared' }, { status: 'resubmitted' }]
            reportCountDoor = await QUERYCTRL.totalCount(req, res, Report, statusQuery)
            pilReportCountDoor = await QUERYCTRL.totalCount(req, res, PilReport, statusQuery)
        }
        if (reportCountDoor !== false)
            res.send({ message: CONSTANTS.DATA.FOUND, data: [{ partnerCount: partnerCount, reportCountDoor: reportCountDoor, pilReportCountDoor: pilReportCountDoor }] })
    }
    else if (decodedToken.accountType == CONSTANTS.PARTNER) {
        statusQuery = { partnerId: decodedToken._id }
        statusQuery.$or = [{ status: 'shared' }, { status: 'resubmitted' }]
        sharedReportCount = await QUERYCTRL.totalCount(req, res, Report, statusQuery)
        pilSharedReportCount = await QUERYCTRL.totalCount(req, res, PilReport, statusQuery)
        if (sharedReportCount !== false)
            draftedReportCount = await QUERYCTRL.totalCount(req, res, Report, { partnerId: decodedToken._id, status: 'drafted' })
        pilDraftedReportCount = await QUERYCTRL.totalCount(req, res, PilReport, { partnerId: decodedToken._id, status: 'drafted' })

        if (draftedReportCount !== false)
            res.send({ message: CONSTANTS.DATA.FOUND, data: [{ sharedReportCount: sharedReportCount, draftedReportCount: draftedReportCount, pilSharedReportCount: pilSharedReportCount, pilDraftedReportCount: pilDraftedReportCount }] })
    }
    else {
        res.send({ message: CONSTANTS.DATA.NOT_FOUND, data: [] })
    }
}

const addToSharedReport = async (req, res) => {
    let id = req.params.id
    if (req.body.status) {
        if (!((req.body.status == 'drafted') || (req.body.status == 'save') || (req.body.status == 'shared'))) {
            return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.INVALID_ENUM })
        }
        let response = await QUERYCTRL.findIdAndUpdate(Report, id, req, res)
        if (response)
            res.send({ status: HttpStatus.OK, message: `Report ${req.body.status} successfully` })
    }
    else {
        res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.ROYALTY_FEE.STATUS_ONLY })
    }
}
const addPilReport = async (req, res) => {
    let { month, year } = req.body;
    let data = await QUERYCTRL.getData(req, res, PilRoyaltyFeeTypeB, { status: true }, {});
    if (data && data.length == 0) {
        return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.PIL_ROYALTY_FEE.NO_PIL_ROYALTY });
    }
    let requiredParams = ['month', 'year', 'internalTrainerCost', 'plfChargedToClient']
    let decodedToken = res.locals.decodedToken,
        alreadyAdded = false,
        user = await QUERYCTRL.getData(req, res, User, { _id: decodedToken._id }),
        response = await QUERYCTRL.getData(req, res, PilReport, { partnerId: decodedToken._id });

    if (response) {
        let monthYearObj = [];
        for (let report of response) {
            if ((parseInt(req.body.month) == report.month) && (parseInt(req.body.year) == report.year)) {
                alreadyAdded = true
            }
        }
        if (alreadyAdded) {
            return res.send({ status: HttpStatus.NOT_FOUND, message: `Report is already added for ${CONSTANTS.monthName[parseInt(req.body.month)]}, ${parseInt(req.body.year)}, please check in Drafted/Shared report section at home screen.` })
        }
        if (utilityMethods.checkRequiredParams(req.body, requiredParams, res)) {
            req.body.partnerId = res.locals.decodedToken._id
            if (user[0].belongsTo == "pilNetwork") {
                if (user[0].apr == "asPerAgreement") {
                    req.body.targetAmount = user[0].targetAmount;
                    req.body.period = user[0].period;
                }
                req.body.internalCertiFee = user[0].internalCertiFee;
                req.body.status = "drafted"
                req.body.doorStatus = "pending"
                req.body.doorComment = [];
                req.body.pilRoyaltyObj = {
                    plfCost: data[0].plfCost,
                    nonPlfRoyalties: data[0].nonPlfRoyalties,
                    workshopDelivery: data[0].workshopDelivery,
                    _id: data[0]._id
                }
                let response = await QUERYCTRL.saveData(req, res, PilReport)
                if (response) {
                    let sendResponse = CONSTANTS.getSaveMessage(response, 'Report')
                    sendResponse['data'] = [{ id: response._id }]
                    res.send(sendResponse);
                }
            } else if (user[0].belongsTo == "both") {

            }
        }
    }
}


const getPILreport = async (req, res) => {
    let id = req.params.id,
        query = {},
        populateObj = [true, 'partnerId', ['name', 'belongsTo', 'country']],
        decodedToken = res.locals.decodedToken,
        projection = { __v: 0 },
        response;
    id ? query._id = id : query;
    if (decodedToken.accountType == CONSTANTS.DOOR)
        query.$or = [{ status: 'shared' }, { status: 'resubmitted' }]
    else
        query.partnerId = decodedToken._id;
    let data = await QUERYCTRL.getData(req, res, PilRoyaltyFeeTypeB, { status: true }, {});
    response = await QUERYCTRL.getData(req, res, PilReport, query, projection)
    let updatedResponse;
    for (let obj of response) {
        updatedResponse = await QUERYCTRL.updateArrData(obj.pilRoyaltyObj, data[0], res, PilReport)
    }
    let resp = await QUERYCTRL.getData(req, res, PilReport, query, projection, populateObj)
    if (response)
        res.send(CONSTANTS.getDataMessage(resp))
}

const updatePILreport = async (req, res) => {
    let accountType = res.locals.decodedToken.accountType,
        query = { _id: req.params.id },
        data = { body: {} },
        msgObj,
        response = await QUERYCTRL.getData(req, res, PilReport, query),
        requestBody = req.body,
        invalidDoorStatus = !(['approved', 'rejected', 'pending', 'resubmitted'].includes(requestBody.doorStatus)),
        invalidStatus = !(['drafted', 'shared', 'resubmitted'].includes(requestBody.status));

    if (accountType == CONSTANTS.DOOR) {
        if (invalidDoorStatus) {
            msgObj = { doorStatus: req.body.doorStatus ? CONSTANTS.DATA.INVALID_ENUM : CONSTANTS.DATA.DOOR_STATUS_REQUIRED }
            return res.send({ status: HttpStatus.NOT_FOUND, message: msgObj.doorStatus, error: msgObj })
        } else {
            data.body.doorStatus = requestBody.doorStatus;
            data.body.$push = { doorComment: { comment: requestBody.doorComment } };
            let updateResponse = await QUERYCTRL.findAndUpdateData(data, res, PilReport, query)
            if (updateResponse) {
                Mail.updateReport(updateResponse)
                res.send(CONSTANTS.getFindUpdateMessage())
            }
        }
    }
    else if (accountType == CONSTANTS.PARTNER) {
        if (invalidStatus) {
            msgObj = { status: req.body.status ? CONSTANTS.DATA.INVALID_ENUM : CONSTANTS.DATA.STATUS_REQUIRED }
            return res.send({ status: HttpStatus.NOT_FOUND, message: msgObj.status, error: msgObj })
        } else {
            let condition1 = response && response[0]._doc.doorStatus == 'rejected' && requestBody.status == 'resubmitted',
                condition2 = response && response[0]._doc.doorStatus == 'pending' && (requestBody.status == 'drafted' || requestBody.status == 'shared');
            if (condition1 || condition2) {
                data.body.status = requestBody.status;
                if (condition1)
                    data.body.doorStatus = 'resubmitted';
                    debugger;
                response = await QUERYCTRL.updateData(data, res, PilReport, query)
                if (response)
                    return res.send(CONSTANTS.getUpdateMessage(response))
            }
            else {
                if (response && response[0]._doc.doorStatus == 'approved')
                    msgObj = { status: CONSTANTS.REPORT.ALREADY_APPROVED }
                else
                    msgObj = { status: CONSTANTS.DATA.INVALID_ENUM }
                return res.send({ status: HttpStatus.NOT_FOUND, message: msgObj.status, error: msgObj })
            }
        }
    }
    else {
        return res.send({ status: HttpStatus.NOT_FOUND, message: CONSTANTS.UNAUTHORIZED })
    }
}

const deletePILreport = async (req, res) => {
    let query = { _id: req.params.id },
        response = await QUERYCTRL.deleteData(req, res, PilReport, query);

    if (response)
        res.send(CONSTANTS.getDeleteMessage(response))
}

/*________________________________________________________________________
 * @Date        :   03 April ,2018
 * Modified On  :	-
 * @Author      :   Supriya Singh
 * @Purpose     :   To set client details.
 _________________________________________________________________________
*/
const addPilClientDetails = async (req, res) => {
    let requiredParams = ['customer', 'invoiceNumber', 'track', 'facilitatorName', 'numberOfPerson', 'perQuantityCost', 'plfCost', 'pax', 'amountBilled', 'workshopDeliveryAmount', 'workshopDeliveryDay', 'accountabilityAmount']
    let pilReportId = req.params.pilReportId,
        query = { _id: pilReportId },
        reportData,
        projection = { __v: 0 }

    reportData = await QUERYCTRL.getData(req, res, PilReport, query, projection)
    if (reportData) {
        if (utilityMethods.checkRequiredParams(req.body, requiredParams, res)) {
            PilReport.findByIdAndUpdate(
                { _id: pilReportId },
                { $push: { "client_details": req.body } },
                { safe: true, upsert: true },
                (err, model) => {
                    if (err) {
                        return res.send(err);
                    }
                    return res.send(CONSTANTS.getSaveMessage(['found'], 'Client'));
                }
            );
        }
    }
}

const getPilClientDetails = async (req, res) => {
    let pilReportId = req.params.pilReportId,
        clientId = req.params.clientId,
        query = {},
        projection = {};
    if (pilReportId)
        query = { _id: pilReportId }
    let response = await QUERYCTRL.getData(req, res, PilReport, query, projection)
    if (response) {
        if (response.length > 0)
            res.send(CONSTANTS.getDataMessage(response))
        else
            res.send(CONSTANTS.getDataMessage([]))
    }
}

const updatePilClientDetails = async (req, res) => {
    let pilReportId = req.params.pilReportId,
        clientId = req.params.clientId,
        reportData,
        query = { _id: pilReportId },
        projection = { __v: 0 };

    let requiredParams = ['customer', 'invoiceNumber', 'track', 'facilitatorName', 'numberOfPerson', 'perQuantityCost', 'plfCost', 'pax', 'amountBilled', 'workshopDeliveryAmount', 'workshopDeliveryDay', 'accountabilityAmount']

    reportData = await QUERYCTRL.getData(req, res, PilReport, query, projection)
    if (reportData) {
        if (utilityMethods.checkRequiredParams(req.body, requiredParams, res)) {
            req.body._id = clientId
            PilReport.update({ 'client_details._id': clientId },
                { $set: { 'client_details.$': req.body } },
                (err, model) => {
                    if (err) {
                        return res.send(errHandler(err));
                    }
                    return res.send(CONSTANTS.getUpdateMessage(model));
                }
            )
        }
    }
}

const deletePilClientDetails = async (req, res) => {
    let _id = req.params.pilReportId;
    let clientId = req.params.clientId;
    PilReport.findByIdAndUpdate(
        _id,
        { $pull: { 'client_details': { _id: clientId } } },
        (err, model) => {
            // debugger
            if (err) {
                console.log(err);
                return res.send(err);
            }
            return res.send(CONSTANTS.getUpdateMessage({ n: 1 }));
        }
    );
}

const getPilSampleExcel = async (req, res) => {
    let decodedToken = res.locals.decodedToken;
    let filename = "sample_PIL_monthly.xlsx";
    res.send({ message: CONSTANTS.DATA.FOUND, data: [{ path: CONSTANTS.SAMPLE_EXCEL_BASE_PATH + filename }], status: HttpStatus.OK })
}

const generatePilExcelCalculation = async (req, res) => {
    if (req.body.data) {
        let jsonData = req.body.data,
            data,
            pilReportId = req.params.pilReportId,
            total_amount_internalCerti = 0,
            total_amount_pflCost = 0,
            total_amount_accountCoaching = 0,
            total_amount_workshop = 0,
            reportData = await QUERYCTRL.getData(req, res, PilReport, { _id: pilReportId });
        if (reportData)
            data = await QUERYCTRL.getData(req, res, User, { _id: reportData[0].partnerId });
        if (data) {
            let jsonDataHeader = [['Client', 'Track', 'Invoice Number', 'Facilitator Name', 'Number/ Quantity', 'Per PLF in US$', 'PLF Cost in US$', 'Days', 'Amount in US$', 'Days', 'Billed Amount in US$', 'Pax', 'Billed Amount in US$']];
            for (let col of jsonData) {
                if (col && col.length) {
                    if (col[0] && col[1] && col[2] && col[4] && col[5] && col[10]) {
                        if (!(col[6] && col[7])) {
                            res.send({ message: `Missing ${jsonDataHeader[0][6]}/ Missing ${jsonDataHeader[0][7]}` })
                        }
                        if (!(col[8] && col[9])) {
                            res.send({ message: `Missing ${jsonDataHeader[0][8]}/ Missing ${jsonDataHeader[0][9]}` })
                        }

                        if (col && col[4] && col[5]) {
                            let PLF_Cost = parseInt(col[4]) * parseInt(col[5]);
                            col.splice(6, 0, PLF_Cost);
                            total_amount_pflCost += PLF_Cost;
                        }
                        if (col[7]) total_amount_workshop += parseInt(col[7]);
                        if (col[10]) total_amount_accountCoaching += parseInt(col[10]);
                        if (reportData[0].internalCertiFee && col[11]) {
                            let Billed_Amount = parseInt(reportData[0].internalCertiFee) * parseInt(col[11]);
                            col[12] = Billed_Amount;
                            total_amount_internalCerti += Billed_Amount;
                        }
                    } else {
                        res.send({ message: `Missing Required Params` })
                    }
                } else {
                    res.send({ message: `Please fill report` })
                    //throw error
                }

            }
            //debugger;
            let activePilRoyalty = await QUERYCTRL.getData(req, res, PilRoyaltyFeeTypeB, { status: true }, {});
            // let monthly_summary = {Territory_Billings_to_Client: {}, PLF_Royalties : {}};
            //debugger;
            let monthly_summary = [], summary = { Territory_Billings_to_Client: {}, PLF_Royalties: {} }, final_monthly_summary = {};
            monthly_summary[0] = ['Territory Billings to Client', 'Workshop Delivery', 'Accountability Coaching', 'Internal Trainer Certification Cost', 'PLF charged to Client', 'PLF & Royalties to DI', 'Internal Certification', 'PLF Cost', 'Non-PLF royalties']
            monthly_summary[1] = [
                null,
                activePilRoyalty[0].workshopDelivery * total_amount_workshop / 100,
                total_amount_accountCoaching,
                req.body.plfChargedToClient,
                req.body.internalTrainerCost,
                null,
                total_amount_pflCost,
                total_amount_accountCoaching * reportData[0].pilRoyaltyObj.nonPlfRoyalties / 100,
                total_amount_internalCerti
            ]
            //debugger;
            summary.Territory_Billings_to_Client.Workshop_Delivery = activePilRoyalty[0].workshopDelivery * total_amount_workshop / 100;
            //debugger;
            summary.Territory_Billings_to_Client.Accountability_Coaching = total_amount_accountCoaching;
            summary.Territory_Billings_to_Client.PLF_charged_to_Client = reportData[0].plfChargedToClient;//modi
            summary.Territory_Billings_to_Client.Internal_Trainer_Certi = reportData[0].internalTrainerCost;//modi
            summary.PLF_Royalties.PLF_Cost = total_amount_pflCost;
            summary.PLF_Royalties.Non_PLF_royalties = total_amount_accountCoaching * reportData[0].pilRoyaltyObj.nonPlfRoyalties / 100;
            summary.PLF_Royalties.Internal_Certification = total_amount_internalCerti;
            final_monthly_summary.Total_Territory_Billings_to_Client = summary.Territory_Billings_to_Client.Workshop_Delivery
                + summary.Territory_Billings_to_Client.Accountability_Coaching
                + summary.Territory_Billings_to_Client.PLF_charged_to_Client
                + summary.Territory_Billings_to_Client.Internal_Trainer_Certi;
            final_monthly_summary.Total_PLF_Royalties = summary.PLF_Royalties.PLF_Cost
                + summary.PLF_Royalties.Non_PLF_royalties
                + summary.PLF_Royalties.Internal_Certification;
            final_monthly_summary.clients = jsonDataHeader.concat(jsonData);
            final_monthly_summary.monthly_summary = monthly_summary;

            res.send(CONSTANTS.getDataMessage(final_monthly_summary));
        }
    }
    else {
        res.send({ message: CONSTANTS.DATA.NO_FILE, status: HttpStatus.NOT_FOUND })
    }
}

const downloadExcelPILReport = async (req, res) => {
    let pilReportId = req.params.pilReportId,
        query = { _id: pilReportId },
        projection = { __v: 0 },
        populateObj = [true, 'partnerId', ['email', 'name', 'country']],    
        userReport = await QUERYCTRL.getData(req, res, PilReport, query, projection, populateObj),
        countryObj = await QUERYCTRL.getData(req, res, Country, { _id: req.body.country }, projection);
    if (userReport) {
        if (!req.body.data) {
            
            return res.send({ message: CONSTANTS.DATA.NO_FILE, status: HttpStatus.NOT_FOUND })
        }
        let jsonData = req.body.data,
            { month, year } = req.body,
            country = countryObj[0].name;

            debugger;
        if (req.files && req.files.excel)
            jsonData = xlsx.parse(req.files.excel.data)[0].data;
        // Generate Report
        const report = newExcel.buildExport(
            [
                {
                    name: 'PILReport',
                    heading: EXCEL_UTIL.getPILHeading( country, month, year ),
                    merges: EXCEL_UTIL.getPILMerge(),
                    specification: EXCEL_UTIL.getPILSpecification(),
                    data: EXCEL_UTIL.getPILDataSet(jsonData, month, year)
                }
            ]
        );
        // return res.send(EXCEL_UTIL.getDataSet(jsonData, country, month, year, isRoyalty))
        // Save generated File
        let uniqString = Math.random().toString(36).substring(2, 15),
            filename = `PIL_${country}_Report_for_${CONSTANTS.monthName[month]}_${year}_${uniqString}.xlsx`,
            basePath = path.resolve(".") + "/public/excel/",
            filePath = basePath + filename;
        fs.writeFile(filePath, report, function (err) {
            if (err) {
                console.log(err);
                return res.send(errHandler(error))
            }
            console.log("The file was saved on location ", filePath)
            res.send({ message: CONSTANTS.DATA.FOUND, data: [{ path: 'http//:192.168.4.241:3000/excel/' + filename }], status: HttpStatus.OK })
        });
    }
}

const addPILClientDetailsByExcelData = async (req, res) => {
    if (req.body) {
        let jsonData = req.body.data,
            status = req.body.status,
            data = [],
            _id = req.params.pilReportId,
            summary,
            plfChargedToClient,
            internalTrainerCost,
            excelHeader = ['customer', 'track', 'invoiceNumber', 'facilitatorName', 'numberOfPerson', 'perQuantityCost', 'plfCost', 'workshopDeliveryDay', 'workshopDeliveryAmount', 'accountabilityDays', 'accountabilityAmount', 'pax', 'amountBilled']
        if (status == 'shared' || status == "drafted" || status == 'resubmitted') {
            if (status == 'resubmitted') {
                let query = { _id: _id }
                let data = await QUERYCTRL.getData(req, res, PilReport, query)
                if (data.length && (data[0]._doc.doorStatus != 'rejected' && data[0]._doc.doorStatus != 'resubmitted')) {
                    console.log(data[0]._doc.doorStatus)
                    return res.send({ message: CONSTANTS.DATA.INVALID_ENUM, status: HttpStatus.NOT_FOUND })
                }
            }
            debugger;
            for (let i = 1; i < jsonData.clients.length; i++) {
                let clientDetail = {};
                for (let j = 0; j < excelHeader.length; j++) {
                    clientDetail[excelHeader[j]] = jsonData.clients[i][j] ? jsonData.clients[i][j] : ''
                }
                data.push(clientDetail)
            }
            if (jsonData.monthly_summary && jsonData.monthly_summary.length) {
                summary = {
                    workshopDeliveryDI: jsonData.monthly_summary[1][1],
                    accountabilityCoaching: jsonData.monthly_summary[1][2],
                    totalPlfCost: jsonData.monthly_summary[1][7],
                    nonPlfRoyaltiesDI: jsonData.monthly_summary[1][8],
                    internalCertification: jsonData.monthly_summary[1][6]
                }
                internalTrainerCost = jsonData.monthly_summary[1][3];
                plfChargedToClient = jsonData.monthly_summary[1][4];
            }
            let updateDataObj = {
                "status": status,
                "plfChargedToClient": plfChargedToClient, 
                "internalTrainerCost": internalTrainerCost, 
                "client_details": data,
                "monthlySummary": summary
            }
            PilReport.findByIdAndUpdate(_id, updateDataObj ).populate('partnerId').exec((err, model) => {
                if (err) {
                    return res.send(errHandler(err));
                }
                if (res.locals.decodedToken.accountType == CONSTANTS.DOOR)
                    Mail.updateReport(model, 'modified')
                return res.send(CONSTANTS.getSaveMessage(['found'], 'Client'));
            });
        }
        else
            res.send({ message: CONSTANTS.DATA.INVALID_ENUM, status: HttpStatus.NOT_FOUND })
    }
    else {
        res.send({ message: CONSTANTS.DATA.NO_FILE, status: HttpStatus.NOT_FOUND })
    }
}

let adminPartner = {
    addFacilitator,
    getFacilitator,
    updateFacilitator,
    deleteFacilitator,
    addReport,
    getReport,
    updateReport,
    deleteReport,
    addClientDetails,
    getClientDetails,
    updateClientDetails,
    deleteClientDetails,
    getTotalCount,
    getSampleExcel,
    uploadExcel,
    generateExcelCalculation,
    addClientDetailsByExcelData,
    downloadExcelReport,
    addToSharedReport,
    addPilReport,
    getPILreport,
    updatePILreport,
    deletePILreport,
    addPilClientDetails,
    getPilClientDetails,
    updatePilClientDetails,
    deletePilClientDetails,
    getPilSampleExcel,
    generatePilExcelCalculation,
    downloadExcelPILReport,
    addPILClientDetailsByExcelData
};

export default adminPartner;
