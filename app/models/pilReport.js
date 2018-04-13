import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { strictEqual } from 'assert';

let Schema = mongoose.Schema;

let pilReportSchema = new Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    plfChargedToClient: { type: String },
    internalTrainerCost: { type: String },
    targetAmount: { type: String },
    period: { type: String },
    apr: { type: String },
    internalCertiFee: { type: String },
    pilRoyaltyObj: {
        plfCost: { type: Number, required: true },
        nonPlfRoyalties: { type: Number, required: true },
        workshopDelivery: { type: Number, required: true },
        _id: { type: String }
    },
    client_details: [{
        customer: { type: String, required: true },
        invoiceNumber: { type: String, required: true },
        track: { type: String, required: true },
        facilitatorName: { type: String },
        numberOfPerson: { type: Number, required: true },
        perQuantityCost: { type: Number },
        plfCost: { type: Number, required: true },
        pax: { type: String, required: true },
        amountBilled: { type: String, required: true },
        workshopDeliveryAmount: { type: Number },
        workshopDeliveryDay: { type: String },
        accountabilityAmount: { type: Number },
        accountabilityDays: { type: Number }
    }],
    monthlySummary: {
        workshopDeliveryDI: { type: String },
        accountabilityCoaching: { type: String },
        totalPlfCost: { type: String },
        nonPlfRoyaltiesDI: { type: String },
        internalCertification: { type: String } 
    },
    status: {
        type: String,
        enum: ['drafted', 'shared', 'resubmitted'],
        default: 'drafted'
    },
    doorStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'resubmitted'],
        default: 'pending'
    },
    doorComment: [{
        date: { type: Date, default: Date.now },
        comment: { type: String }
    }],
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, select: false },
    updatedAt: { type: Date, default: Date.now, select: false }
});

pilReportSchema.plugin(uniqueValidator);
pilReportSchema.plugin(uniqueValidator, { message: "Report already exists" });
let pilReport = mongoose.model('pilReport', pilReportSchema);

export default pilReport;