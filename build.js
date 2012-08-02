// Creates the andbang.js source from the provided API
// specification.

var TEMPLATE = "andbang.template.js",
    OUTPUT = "andbang.js";

var fs = require('fs'),
    mustache = require('mustache'),
    andbangSpec = require('andbang-spec'),
    yetify = require('yetify'),
    colors = require('colors');
    
var methods = andbangSpec.getMethodsByApiType('js'),
    template = fs.readFileSync(TEMPLATE, 'utf-8'),
    api = {"methods": []};

methods.forEach(function (method) {
    var params = method.params.map(function (param) { return param.name; });
    params.push("cb");
    params = params.join(", ");
    api.methods.push({
        "methodName": method.name,
        "params": params,
        "description": method.description
    });
});

fs.writeFileSync(OUTPUT, mustache.render(template, api), 'utf-8');

console.log('\n' + yetify.andBangLogo() + ':');
console.log(OUTPUT.bold + ' file built.'.grey + '\n');
process.exit(0);    
