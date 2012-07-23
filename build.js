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
    var is_js_api = function (api)  { return api.type === "js" },
        or        = function (a, b) { return a || b; },
        method_has_js_api = method.apis.map(is_js_api).reduce(or);
  
    if (method_has_js_api) {
        var obtain_param_name = function (param) { return param.name;},
            params = method.params.map(obtain_param_name);
            params.push("cb");
            params = params.join(", ");
        api["methods"].push({
            "methodName": method_name,
            "params": params 
        });
    }
}
var output = mustache.render(template, api);
fs.writeFileSync(OUTPUT, output, 'utf-8');

console.log(OUTPUT + ' file built.');
process.exit(0);    

build.js: line 15, col 3, Expected 'var' to have an indentation at 5 instead at 3.
build.js: line 16, col 3, Expected 'var' to have an indentation at 5 instead at 3.
build.js: line 16, col 61, Missing semicolon.
build.js: line 20, col 3, Expected 'if' to have an indentation at 5 instead at 3.
build.js: line 21, col 5, Expected 'var' to have an indentation at 9 instead at 5.
build.js: line 21, col 66, Missing space after ';'.
build.js: line 25, col 5, Expected 'api' to have an indentation at 9 instead at 5.
build.js: line 25, col 9, ['methods'] is better written in dot notation.
build.js: line 26, col 7, Expected 'methodName' to have an indentation at 13 instead at 7.
build.js: line 27, col 7, Expected 'params' to have an indentation at 13 instead at 7.
build.js: line 28, col 5, Expected '}' to have an indentation at 9 instead at 5.
build.js: line 29, col 3, Expected '}' to have an indentation at 5 instead at 3.
build.js: line 35, col 1, 'process' is not defined.

