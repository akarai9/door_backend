import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

let Schema = mongoose.Schema;

/*________________________________________________________________________
 * @Date        :   21 Feb,2018
 * Modified On  :	22 Feb,2018(Abhishek Verma)
 * @Author      :   Mansi Teharia
 * @Purpose     :   This is the schema of facilitator
 _________________________________________________________________________
*/

let facilitatorSchema = new Schema({
    uuid        : { type: String, required: true, unique: true },
    name        : { type: String, required: true },
    status      : { type: Boolean, default : true },
    partnerId   : { type: mongoose.Schema.Types.ObjectId, ref: 'users', required : true }
});

facilitatorSchema.pre('save', function (next) {
    let user = this;
    if (!user.isModified('name')) return next();
    user.name = user.name.replace(/\w\S*/g, (txt => txt[0].toUpperCase() + txt.substr(1).toLowerCase()));
    next();
});

let facilitator = mongoose.model('facilitator', facilitatorSchema);

export default facilitator;