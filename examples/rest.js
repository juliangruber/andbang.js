var AndBang = require('../andbang');

var api = new AndBang({
    useREST: true,
    token: 'your access token'
});

// now you can make calls like
api.http.getMe(function (err, response, code) {
    if (err) throw err;
    console.log(response, code);
});