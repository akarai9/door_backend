import express from 'express';
import adminPartner from '../app/controllers/adminPartnerCtrl'

let router = express.Router();

/* GET test. */
router.get('/', function (req, res) {
    res.send({ title: 'adminPartner' });
});

/* For Facilitator CRUD */
router.route('/facilitator/:id?')
    .get(adminPartner.getFacilitator)
    .post(adminPartner.addFacilitator)
    .put(adminPartner.updateFacilitator)
    .delete(adminPartner.deleteFacilitator)

/* For Report CRUD */
router.route('/report/:id?')
    .post(adminPartner.addReport)
    .get(adminPartner.getReport)
    .put(adminPartner.updateReport)
    .delete(adminPartner.deleteReport)

/* For Client of CRUD Report */
router.route('/reportclient/:reportId?/:clientId?')
    .post(adminPartner.addClientDetails)
    .get(adminPartner.getClientDetails)                                                                                                                                     
    .put(adminPartner.updateClientDetails)
    .delete(adminPartner.deleteClientDetails)

/* Get Sample excel  */
router.route('/getSampleExcel')
    .get(adminPartner.getSampleExcel)
/* Upload Excel */                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
router.route('/uploadExcel')
    .post(adminPartner.uploadExcel)
/* Generate Calculation from Excel Data */
router.route('/generateExcelCalculation/:reportId')
    .post(adminPartner.generateExcelCalculation)
/* Add Client Details By Excel Data */
router.route('/addClientDetailsByExcelData/:reportId')
    .post(adminPartner.addClientDetailsByExcelData)
/* Download excel  */
router.route('/downloadExcelReport/:reportId')
    .post(adminPartner.downloadExcelReport)


router.route('/addToSharedReport/:id')
    .put(adminPartner.addToSharedReport)

/* To Get Total Count */
router.route('/getTotalCount')
    .get(adminPartner.getTotalCount)

    
module.exports = router;