var AndBang = require('../andbang'),
    config = require('./config'),
    message = function (str) {
        return '\n\n==================== ' + str + ' ====================';
    };

var api = new AndBang({
    useREST: true,
    token: config.token
});

api.http.getMe(function (err, response, code) {
    if (err) throw err;
    console.log(message('USER'));
    console.log(code, response);

    var teamId = response.teams[response.teams.length - 1];

    api.http.createTaskForMe(teamId, {title: 't'}, function (err, response, code) {
        if (err) throw err;
        console.log(message('TASK CREATED'));
        console.log(code, response);

        api.http.updateTask(teamId, response.id, {title: 'The Bestest Title!'}, function (err, response, code) {
            if (err) throw err;
            console.log(message('TASK UPDATED'));
            console.log(code, response);

            api.http.deleteTask(teamId, response.id, function (err, response, cde) {
                if (err) throw err;
                console.log(message('TASK DELETED'));
                console.log(code, response);
            });
        });
    });
});