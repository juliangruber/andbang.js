// Creates the andbang.js source from the provided API
// specification.

/*global __dirname*/
var fileName = 'andbang.js',
    minFileName = 'andbang.min.js',
    templatePath = __dirname + "/andbang.template.js",
    outputPath = __dirname + '/' + fileName,
    minifiedPath = __dirname + '/' + minFileName;

var fs = require('fs'),
    mustache = require('mustache'),
    andbangSpec = require('andbang-spec'),
    yetify = require('yetify'),
    uglify = require('uglify-js'),
    colors = require('colors');
    
var methods = andbangSpec.getMethodsByApiType('js'),
    template = fs.readFileSync(templatePath, 'utf-8'),
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

var code = mustache.render(template, api);

console.log('\n' + yetify.andBangLogo() + ':');

fs.writeFileSync(outputPath, code, 'utf-8');
console.log(fileName.bold + ' file built.'.grey);

var ast = uglify.parser.parse(code),
    pro = uglify.uglify,
    minified;

ast = pro.ast_mangle(ast); // get a new AST with mangled names
ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
minified = pro.gen_code(ast); // build out the code

fs.writeFileSync(minifiedPath, minified, 'utf-8');

console.log(minFileName.bold + ' file built.'.grey + '\n');
process.exit(0);    
