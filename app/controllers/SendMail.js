import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import path from 'path';
import pug from 'pug';
import CONSTANT from '../../util/constants';
import MailSchema from './../models/mailSchema';
import UTILITY from '../../util/utilityMethod'

/*________________________________________________________________________
 * @Date        :   08 Feb,2018
 * Modified On  :	16 Feb,2018
 * @Author      :   Mansi Teharia
 * @Purpose     :   This is used to send mails
 _________________________________________________________________________
*/

let transporter = nodemailer.createTransport();

MailSchema.statics = {
    resetPwdMail : (req, token) => {
        let obj = {};
        obj.msg = pug.renderFile(path.join(__dirname, '../../views/forgotPasswordEmail.pug'), { resetPasswordUrl: CONSTANT.RESET_PASSWORD_PATH + token, name: req._doc.name });
        obj.subject = CONSTANT.MAIL.RESET_PASSWORD;
        obj.email = req.email;
        MailSchema.statics.send(obj);
    },
    addPartnerMail : (req) => {
        let obj = {};
        obj.msg = pug.renderFile(path.join(__dirname, '../../views/registrationTemplate.pug'), { password: req.password, email: req.email, name: req.name, companyName: req.companyName });
        obj.subject = CONSTANT.MAIL.ADD_PARTNER;
        obj.email = req.email;
        if (req.contactPersonEmail)
            obj.ccEmail = req.contactPersonEmail;
        MailSchema.statics.send(obj);
    },
    passwordConfirmationMail : (password, data) => {
        let obj = {};
        obj.msg = pug.renderFile(path.join(__dirname, '../../views/passwordConfirmationTemplate.pug'), { password: password, name: data.name, companyName: data.companyName  });
        obj.subject = CONSTANT.MAIL.CONFIRMATION_MAIL;
        obj.email = data.email;
        if (data.contactPersonEmail)
            obj.ccEmail = data.contactPersonEmail;
        MailSchema.statics.send(obj);
    },
    updateReport: async (data, status) => {
        let obj = {};
        let pugData = { name: data.partnerId.name, month: CONSTANT.monthName[data.month], year: data.year, status: data.doorStatus }
        if(status)
            pugData.status = status
        obj.msg = pug.renderFile(path.join(__dirname, '../../views/updateReport.pug'), pugData );
        obj.subject = CONSTANT.MAIL.UPDATE_REPORT;
        obj.email = data.partnerId.email;
        if (data.partnerId.contactPersonEmail)
            obj.ccEmail = data.partnerId.contactPersonEmail;
        MailSchema.statics.send(obj);
    },
    send : async (obj) => {
        /* let adminEmail = await UTILITY.getAdminEmail()
        if(adminEmail){
        } */
        let data = {
            from: CONSTANT.GMAIL_SMTP_CREDENTIAL.USERNAME,
            to: obj.email,
            cc: obj.ccEmail + "," + 'admindoor@yopmail.com',
            subject: (obj.subject || "No Subject"),
            html: obj.msg
        };
        transporter.sendMail(data, (error, res) => {
            if (error) {
                console.log("error", error);
                return false
            } else {
                console.log('Email sent: ' + res.messageId);
            }
        })
        return true;
    }
};

let Mail = mongoose.model('Mail', MailSchema);

export default Mail;