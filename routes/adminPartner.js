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


/* For PIL Report CRUD */
router.route('/pilReport/:id?')
    .post(adminPartner.addPilReport)
    .get(adminPartner.getPILreport)
    .put(adminPartner.updatePILreport)
    .delete(adminPartner.deletePILreport)


/* For Client of CRUD PIL Report */
router.route('/pilReportclient/:pilReportId?/:clientId?')
    .post(adminPartner.addPilClientDetails)
    .get(adminPartner.getPilClientDetails)                                                                                                                                     
    .put(adminPartner.updatePilClientDetails)
    .delete(adminPartner.deletePilClientDetails)

/* Get PIL Sample excel  */
router.route('/getPilSampleExcel')
    .get(adminPartner.getPilSampleExcel)

/* Generate Calculation from PIL Excel Data */
router.route('/generatePilExcelCalculation/:pilReportId')
    .post(adminPartner.generatePilExcelCalculation)


/* Add PIL Client Details By Excel Data */
router.route('/addPILClientDetailsByExcelData/:pilReportId')
    .post(adminPartner.addPILClientDetailsByExcelData)

/* Download PIL excel  */
router.route('/downloadExcelPILReport/:pilReportId')
    .post(adminPartner.downloadExcelPILReport)


module.exports = router;