// Creates the andbang.js source from the provided API
// specification.

var TEMPLATE = "andbang.template.js",
    OUTPUT = "andbang.js";

var fs = require('fs'),
    mustache = require('mustache'),
    andbangSpec = require('andbang-spec');
    
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

console.log(OUTPUT + ' file built.');
process.exit(0);    
