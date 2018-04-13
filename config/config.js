module.exports = {
    development: {
        // db  : 'mongodb://localhost:27017/door',
        db  : 'mongodb://abhissony_door:door1@ds125628.mlab.com:25628/door',        
        port: process.env.PORT || 3000,
        env : 'development'
    },
    production: {
        db  : 'mongodb://abhissony_door:door1@ds125628.mlab.com:25628/door',
        port: process.env.PORT || 4000,
        env : 'production'
    }
}