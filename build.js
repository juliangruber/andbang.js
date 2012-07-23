// Creates the andbang.js source from the provided API
// specification.

var API_SPEC = "spec.json",
    TEMPLATE = "andbang.template.js",
    OUTPUT = "andbang.js";

var fs = require('fs'),
    mustache = require('mustache'),
    spec = JSON.parse(fs.readFileSync(API_SPEC)),
    template = fs.readFileSync(TEMPLATE, 'utf-8'),
    api = {"methods": []};

for (var method_name in spec) {
    var method = spec[method_name];
    var is_js_api = function (api)  { return api.type === "js"; },
        or        = function (a, b) { return a || b; },
        method_has_js_api = method.apis.map(is_js_api).reduce(or);
  
    if (method_has_js_api) {
        var obtain_param_name = function (param) { return param.name; },
        params = method.params.map(obtain_param_name);
        params.push("cb");
        params = params.join(", ");
        api.methods.push({
            "methodName": method_name,
            "params": params 
        });
    }
}
var output = mustache.render(template, api);
fs.writeFileSync(OUTPUT, output, 'utf-8');

console.log(OUTPUT + ' file built.');
process.exit(0);    
