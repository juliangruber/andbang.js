var Emitter = require('emitter'),
    _ = require('underscore');

var AndBang = function (config) {
    var self = this,
        opts = this.config = _.defaults(config || {}, {
            url: 'http://localhost:3000',
            transports: ['websocket'],
            reconnectAttempts: 20,
            autoConnect: true,
            autoSubscribe: true
        });

    Emitter.call(this);

    if (opts.token && opts.autoConnect) this.connect();
};

// inherit from emitter
AndBang.prototype = new Emitter;

// validate a token
AndBang.prototype.validateToken = function (token, cb) {
    var self = this,
        currentArgs = arguments;
    if (this.connected) {
        this.socket.emit('validateSession', token, function (err, user) {
            if (user) {
                // autosubscribe
                if (self.config.autoSubscribe) self.socket.emit('subscribeTeams');
                console.log('emitting');
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
            self.validateToken.apply(self, currentArgs)
        });
    }
};

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
            'deleteTeam'
        ],
        i = 0,
        l = apiEvents.length;
    
    // set up our socket.io connection
    this.socket = io.connect(this.config.url, {
        'max reconnection attempts': this.config.reconnectAttempts,
        'transports': this.config.transports
    });

    this.socket.on('connect', function () { 
        self.connected = true;
        self.emit('connected');
        if (cb) cb(); 
    });

    this.socket.on('disconnect', function () {
        self.connected = false;
        self.emit('disconnected');
    });

    this.socket.on('error', function (reason) {
        if (reason === 'handshake unauthorized') self.emit('connectFail');
        self.emit('error', reason);
    });

    // passthrough of our events so that the API will emit them directly.
    for (; i < l; i++) {
        this.socket.on(apiEvents[i], function (event) {
            return function (payload) {
                self.emit(event, payload);
            }
        }(apiEvents[i]));
    }
};

// Handles translating multiple arguments into an array of args
// since socket.io limits us to sending a single object as a payload.
AndBang.prototype._callApi = function (method, arguments) {
    var myArray = _.toArray(arguments),
        last = _.last(myArray),
        cb = _.isFunction(last) ? last : null,
        args = cb ? _.initial(myArray) : myArray;
    
    if (args.length) {
        this.socket.emit(method, args, cb);
    } else {
        this.socket.emit(method, cb);
    }
}

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
AndBang.prototype.updateTask = function (team, taskId, attrs, cb) {
    this._callApi('updateTask', arguments);
};
AndBang.prototype.shipTask = function (team, taskId, cb) {
    this._callApi('shipTask', arguments);
};

module.exports = AndBang;