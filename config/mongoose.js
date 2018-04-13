import mongoose from 'mongoose';

module.exports = (config) =>{
    mongoose.connect(config.db, { useMongoClient: true }, (err, database) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log("Database is connected with", config.db);
    });
}