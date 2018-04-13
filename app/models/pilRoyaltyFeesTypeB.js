import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

let Schema = mongoose.Schema;

/*________________________________________________________________________
 * @Date        :   27 March,2018
 * Modified On  :	-
 * @Author      :   Supriya Singh
 * @Purpose     :   This is the schema of PIL royalty fee type B (PIL)
 _________________________________________________________________________
*/

let pilRoyaltyFeeTypeBSchema = new Schema({
    year  : { type: String },
    month   : { type: String },
    plfCost    : { type: Number, required: true},
    nonPlfRoyalties     : { type: Number, required: true },
    workshopDelivery      : { type: Number, required:true },
    status : { type: Boolean, default:true }
});


let pilRoyaltyFeeTypeB = mongoose.model('pilRoyaltyFeeTypeB', pilRoyaltyFeeTypeBSchema);

export default pilRoyaltyFeeTypeB;