/*global __dirname, global*/
var fs = require('fs');
var vm = require('vm');
var apiFile = fs.readFileSync(__dirname + '/../andbang.js', 'utf-8').toString();
var testFile = fs.readFileSync(__dirname + '/rest.js', 'utf-8').toString();

global.require = require;
global.exports = exports;
global.module = module;
global.request = function (options, cb) {
    cb(null, {statusCode: 200}, options);
};

var context = vm.createContext(global);

vm.runInContext(apiFile + '\n' + testFile, context);


