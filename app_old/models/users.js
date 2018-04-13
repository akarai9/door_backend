
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import uniqueValidator from 'mongoose-unique-validator';
import CONSTANTS from '../../util/constants'
import encryptin from './../../util/encryption'
let Schema = mongoose.Schema;

/*________________________________________________________________________
 * @Date        : 08 Feb,2018
 * Modified On  :	22 Feb,2018
 * @Author      : Mansi Teharia, Abhishek Verma
 * @Purpose     : This is the schema of User
 _________________________________________________________________________
*/

let userSchema = new Schema({
    email               : { type : String, unique: true , required: true },
    name                : { type : String, required: true },
    companyName         : { type : String, required: true },
    phone               : { type : String, required : true, min : 8, max : 15 },
    contactPersonName   : { type : String },
    contactPersonEmail  : { type : String },
    contactPersonPhone  : { type : String },
    
    avatar              : { type : String, default: '' },
    password            : { 
                            type : String, 
                            required: true
                          } ,
    accountType         : { type : String,
                            enum : ['door','pil', 'partner'],
                            default :'partner'
                          },
    verifyEmail         : {
                            verificationStatus : {type : Boolean, default : false },
                            email : {type:String}
                          },
    verificationToken   : { type : String },
    resetPasswordToken  : { type : String },
    resetPasswordExpires: { type : Date },
    status              : { type : Boolean, default: true },
    designation         : { type : String, required : true },
    /* contractDuration    : { type : String },
    currentContractYear : { type : String }, */
    startContractDate   : { type : String },
    endContractDate     : { type : String },
    apr                 : { type : String },
    targetAmount        : { type : String, required : true},
    internalCertificationFees: { type : String, required : true},
    period              : { type: String,
                            enum: ['doorNetwork', 'pilNetwork', 'both'],
                            required: true
                          },
    belongsTo           : { type : String,
                            enum: ['halfYearly', 'annually'],
                            required : true
                          },
    ptkFee              : { type : String },
    isDeleted           : { type : Boolean, default: false },
    createdAt           : { type : Date, default : Date.now, select: false },
    updatedAt           : { type : Date, default : Date.now, select: false },
    royaltyFeeStatus    : { type : String,
                            enum : ['yes', 'no'],
                            required : true
                          },
    country             : { 
                            type : mongoose.Schema.Types.ObjectId, 
                            ref : 'country', 
                            required : true
                          }
});


userSchema.pre('save', function (next) {
  let user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(CONSTANTS.SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

// userSchema.pre('update', function(next) {
//   let user = this;

//   this.update({},{ $set: { updatedAt: new Date() } });
// });

userSchema.plugin(uniqueValidator);
userSchema.plugin(uniqueValidator, { message: "Email already exists." });
let users = mongoose.model('users', userSchema);
export default users;