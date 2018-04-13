import uniqueValidator from 'mongoose-unique-validator';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let countrySchema = new Schema({
    name        : { type: String, unique: true, required: true, uppercase: true },
    code        : { type: String, unique: true, required: true, uppercase: true },
    currencyCode: { type: String, required: true, uppercase: true },
    status      : { type: Boolean, default: true }
});

let updateCountryValidator = function (next) {
    let update = this._update;
    let UpperCaseCurrencyCode = update.$set.currencyCode.toUpperCase();
    if (update.$set && update.$set.currencyCode) {
        this.update({ currencyCode: UpperCaseCurrencyCode });
    }
    next();
};

countrySchema.pre('updateOne', updateCountryValidator);

countrySchema.plugin(uniqueValidator);
countrySchema.plugin(uniqueValidator, { message: "Country already exists." });
let country = mongoose.model('country', countrySchema);
module.exports = country;