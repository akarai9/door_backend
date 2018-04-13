import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { strictEqual } from 'assert';

let Schema = mongoose.Schema;

let reportSchema = new Schema({
    partnerId       : { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    month           : { type: Number, required: true },
    year            : { type: Number, required: true },
    local_currency  : { type: String, required: true },
    eur_x_rate      : { type: Number, required: true },
    usd_x_rate      : { type: Number, required: true },
    royaltyArray    : [{
                        name : { type : String } ,
                        amount : { type : Number },
                        _id : { type : String }
                      }],
    client_details  : [{
            customer                        : { type: String, required: true },
            industry                        : { type: String },
            country                         : { type: String, required: true },
            invoice_number                  : { type: String, required: true },
            english_description_of_course   : { type: String },
            number_of_days                  : { type: Number },
            invoice_amount                  : { type: Number, required: true },
            currency_code                   : { type: String, required: true },
            royalty                         : { type: String, required: true },
            category                        : { type: String, required: true },
            curriculum_n_Program            : { type: String, required: true },
            xrate_eur                       : { type: Number, required: true },
            total_amount_in_eur             : { type: Number },
            xrate_usd                       : { type: Number, required: true },
            total_amount_in_usd             : { type: Number },
            royalty_due_in_eur              : { type: Number },
            royalty_due_in_usd              : { type: Number }
    }],
    status          : { type    : String,
                        enum    : ['drafted', 'shared', 'resubmitted'],
                        default : 'drafted'
                    },
    doorStatus      : {
                        type    : String,
                        enum    : ['pending', 'approved', 'rejected', 'resubmitted' ],
                        default : 'pending'
                    },
    doorComment     : [{
                        date    : { type: Date, default: Date.now },
                        comment : { type: String }
    }],
    isDeleted       : { type: Boolean, default: false },
    createdAt       : { type: Date, default: Date.now, select: false },
    updatedAt       : { type: Date, default: Date.now, select: false }
});

reportSchema.plugin(uniqueValidator);
reportSchema.plugin(uniqueValidator, { message: "Report already exists" });
let report = mongoose.model('report', reportSchema);

export default report;