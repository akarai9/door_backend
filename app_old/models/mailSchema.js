import mongoose from 'mongoose';

let Schema = mongoose.Schema;

/*________________________________________________________________________
 * @Date        :   08 Feb,2018
 * Modified On  :	16 Feb,2018
 * @Author      :   Mansi Teharia
 * @Purpose     :   This is the schema of mail
 _________________________________________________________________________
*/

let MailSchema = new Schema({
    to          : { type: String },
    subject     : { type: String },
    body        : { type: String },
    title       : { type: String },
    status      : { type: Schema.Types.Mixed },
    updated_at  : { type: Date },
    deleted_at  : { type: Date, default: null },
    created_at  : { type: Date }
});

export default MailSchema;