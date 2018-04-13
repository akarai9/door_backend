import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
let Schema = mongoose.Schema;

let loginSchema = new Schema({
    userId      : { type: String, required: true },
    token       : { type: String, required: true },
    createdAt   : { type: Date, default: Date.now, select: false },
});

var login = mongoose.model('login', loginSchema);

export default login;