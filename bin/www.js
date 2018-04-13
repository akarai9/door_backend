// by requiring `babel/register`, all of our successive `require`s will be Babel'd
require('babel-register')({
    presets: ['es2015', "stage-0"]
});
require("babel-polyfill")

var app = require('../app');