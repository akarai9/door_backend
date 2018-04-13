import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

let Schema = mongoose.Schema;

/*________________________________________________________________________
 * @Date        :   21 Feb,2018
 * Modified On  :	-
 * @Author      :   Mansi Teharia
 * @Purpose     :   This is the schema of royalty fee type A
 _________________________________________________________________________
*/
var min = [0, 'The value of path `{PATH}` ({VALUE}) is beneath the limit ({MIN}).'];
var max = [12, 'The value of path `{PATH}` ({VALUE}) exceeds the limit ({MAX}).'];

let royaltyFeeTypeASchema = new Schema({
    components  : [{   
                    name: { type :  String }, 
                    amount: { type : Number }   
                 }],
    startMonth  : { type: Number, required:true, min : min, max : max },
    startYear   : { type: Number, required:true },
    endMonth    : { type: Number, required: true, min : min, max : max },
    endYear     : { type: Number, required: true },
    status      : { type: Boolean, default:true }
});


royaltyFeeTypeASchema.path('components').validate(components => {
    if(!components){return false}
    else if(components.length === 0){return false}
    return true;
}, 'Royalty Fee Type A needs to have at least one component');


let royaltyFeeTypeA = mongoose.model('royaltyFeeTypeA', royaltyFeeTypeASchema);

export default royaltyFeeTypeA;