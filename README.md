#And Bang API Client
### Makes it dead simple to build web apps on the And Bang API. 

- All API functionality becomes a function call.
- Couldn't be any simpler

Just include the script in your HTML
```html
<script src="andbang.js"></script>
```

Then write some JS

```js
// init an instance of the API connection
var api = new AndBang();

// then log in
api.validateToken('your access token', function (err, yourUser) {
    window.me = yourUser;
});

// 'ready' is triggered when you're successfully logged in
api.on('ready', function () {
    // once 'ready' has been triggered 
    // all your normal API functions are available
    // as function calls.

    // for example, we can just fetch our teams
    // and pass it a callback.
    api.getMyTeams(function (err, myTeams) {
        window.teams = myTeams;
    });
});
```

It uses socket.io under the covers so you get realtime, seemless API access that's as easy as AJAX.

Have fun!

#### REST API

AndBang also exposes a RESTful API that you can access like this:

```js
// init an API instance with your token
var api = new AndBang({
    useREST: true,
    token: 'your access token'
});

// now you can make calls like
api.http.getMe(function (err, response, code) {
    if (err) throw err;
    console.log(response, code);
});
```

### Docs
You can see all available API methods on the developer docs: https://developer.andbang.com

###andbang.template.js
andbang.js is generated from the provided API specification, spec.json. This
allows automation allows for rapid expansion of the API across many platforms.

To generate andbang.js, run the provided build script, which depends on spec.json
and andbang.template.js.

node ./build
