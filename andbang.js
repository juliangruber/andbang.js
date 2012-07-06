(function () {

    // Utils and references
    var root = this,
        slice = Array.prototype.slice,
        isFunc = function (obj) {
            return Object.prototype.toString.call(obj) == '[object Function]';
        },
        extend = function (obj1, obj2) {
            for (var i in obj2) obj1[i] = obj2[i];
        };

    // Conditionally import socket.io-client or just use global if present
    root.io || (root.io = require('socket.io-client'));

    // We're using @tjholowaychuck's emitter from UI Kit. Because it's slick and lightweight
    // much props.
    function Emitter() {
        this.callbacks = {};
    }

    // Listen on the given `event` with `fn`.
    Emitter.prototype.on = function (event, fn) {
        (this.callbacks[event] = this.callbacks[event] || []).push(fn);
        return this;
    };

    // Adds an `event` listener that will be invoked a single
    // time then automatically removed.
    Emitter.prototype.once = function (event, fn) {
        var self = this;
        function on() {
            self.off(event, on);
            fn.apply(this, arguments);
        }
        this.on(event, on);
        return this;
    };

    // Remove the given callback for `event` or all
    // registered callbacks.
    Emitter.prototype.off = function (event, fn) {
        var callbacks = this.callbacks[event],
            i;
        
        if (!callbacks) return this;

        // remove all handlers
        if (1 == arguments.length) {
            delete this.callbacks[event];
            return this;
        }

        // remove specific handler
        i = callbacks.indexOf(fn);
        callbacks.splice(i, 1);
        return this;
    };

    // Emit `event` with the given args.
    Emitter.prototype.emit = function (event) {
        var args = [].slice.call(arguments, 1),
            callbacks = this.callbacks[event];

        if (callbacks) {
            for (var i = 0, len = callbacks.length; i < len; ++i) {
                callbacks[i].apply(this, args);
            }
        }

        return this;
    };


    // Main export
    var AndBang = function (config) {
        var self = this,
            opts = this.config = {
                url: 'https://api.andbang.com:443',
                transports: ['websocket', 'flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'],
                reconnectAttempts: 20,
                autoConnect: true,
                autoSubscribe: true
            };

        // use our config settings
        extend(opts, config);
        
        // extend with emitter
        Emitter.call(this);

        // if tokens are passed in, connect right away
        if (opts.token && opts.autoConnect) this.connect();
    };

    // inherit from emitter
    AndBang.prototype = new Emitter();

    // validate a token
    AndBang.prototype.validateToken = function (token, cb) {
        var self = this,
            currentArgs = arguments;
        if (this.connected) {
            this.socket.emit('validateSession', token, function (err, user) {
                if (user) {
                    // autosubscribe
                    if (self.config.autoSubscribe) self.socket.emit('subscribeTeams');
                    self.emit('ready', user);
                    cb(null, true);
                } else {
                    self.emit('loginFailed');
                    cb('Could not log in with token');
                }
            });
        } else {
            // if not connected, connect first, then validate
            this.connect(function () {
                self.validateToken.apply(self, currentArgs);
            });
        }
    };

    // connect function
    AndBang.prototype.connect = function (cb) {
        var self = this,
            apiEvents = [
                'addMember',
                'removeMember',
                'editMember',
                'addTask',
                'deleteTask',
                'editTask',
                'shipTask',
                'assignTask',
                'unassignTask',
                'moveTask',
                'favoriteTask',
                'updateTeam',
                'deleteTeam',
                'newProject'
            ],
            i = 0,
            l = apiEvents.length;
        
        // set up our socket.io connection
        this.socket = root.io.connect(this.config.url, {
            'max reconnection attempts': this.config.reconnectAttempts,
            'transports': this.config.transports
        });

        // emit connect event and call callback if passed in
        this.socket.on('connect', function () { 
            self.connected = true;
            self.emit('connected');
            if (cb) cb(); 
        });

        // emit disconnected set flag
        this.socket.on('disconnect', function () {
            self.connected = false;
            self.emit('disconnected');
        });

        // emit connection error if it's auth failure.
        // and emit other errors too.
        this.socket.on('error', function (reason) {
            if (reason === 'handshake unauthorized') self.emit('connectFail');
            self.emit('error', reason);
        });

        // passthrough of our events so that the API will emit them directly.
        for (; i < l; i++) {
            this.socket.on(apiEvents[i], function (event) {
                return function (payload) {
                    self.emit(event, payload);
                };
            }(apiEvents[i]));
        }
    };

    // Handles translating multiple arguments into an array of args
    // since socket.io limits us to sending a single object as a payload.
    AndBang.prototype._callApi = function (method, incomingArgs) {
        var myArray = slice.call(incomingArgs),
            last = myArray[myArray.length - 1],
            cb = isFunc(last) ? last : null,
            args = cb ? slice.call(myArray, 0, myArray.length - 1) : myArray,
            wrappedCallback = function (err, data, code) {
                if (!cb) return;
                if (typeof data === 'string') {
                    cb(err, JSON.parse(data), code); 
                } else {
                    cb(err, data, code); 
                }
            };
            
        if (args.length) {
            this.socket.emit(method, args, wrappedCallback);
        } else {
            this.socket.emit(method, wrappedCallback);
        }
    };

    // These are listed out explicitly, despite being repetitive, just so the
    // api is a bit more discoverable/readable since we can see which arguments
    // are expected. All callbacks are optional.
    AndBang.prototype.updateUser = function (newAttributes, cb) {
        this._callApi('updateUser', arguments);
    };
    AndBang.prototype.getAllTasks = function (teamIdOrSlug, cb) {
        this._callApi('getAllTasks', arguments);
    };
    AndBang.prototype.getMemberTasks = function (teamIdOrSlug, memberIdOrUsername, cb) {
        this._callApi('getMemberTasks', arguments);
    };
    AndBang.prototype.getTeams = function (cb) {
        this._callApi('getTeams', arguments);
    };
    AndBang.prototype.getAllTeamData = function (cb) {
        this._callApi('getAllTeamData', arguments);
    };
    AndBang.prototype.updateTask = function (teamIdOrSlug, taskId, attrs, cb) {
        this._callApi('updateTask', arguments);
    };
    AndBang.prototype.shipTask = function (teamIdOrSlug, taskId, cb) {
        this._callApi('shipTask', arguments);
    };
    AndBang.prototype.createTask = function (teamIdOrSlug, taskAttributes, cb) {
        this._callApi('createTask', arguments);
    };
    AndBang.prototype.deleteTask = function (teamIdOrSlug, taskId, cb) {
        this._callApi('deleteTask', arguments);
    };

    // attach to windor or export with commonJS
    if (typeof exports !== 'undefined') {
        module.exports = AndBang;
    } else {
        root.AndBang = AndBang;
    }

}).call(this);