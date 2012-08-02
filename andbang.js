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

    AndBang.prototype.disconnect = function () {
        this.socket.disconnect();
    };

    // Update the user properties of the logged in user.
    AndBang.prototype.updateMe = function (userAttributes, cb) {
        this._callApi('updateMe', arguments);
    };
    
    // Get team attributes of teams that you&#39;re part of.
    AndBang.prototype.getMyTeams = function (cb) {
        this._callApi('getMyTeams', arguments);
    };
    
    // Get team attributes and related data for all teams you&#39;re part of.
    AndBang.prototype.getAllMyTeamData = function (cb) {
        this._callApi('getAllMyTeamData', arguments);
    };
    
    // Updates task attributes.
    AndBang.prototype.updateTask = function (teamId, taskId, taskAttributes, cb) {
        this._callApi('updateTask', arguments);
    };
    
    // Assigns a task to another team member.
    AndBang.prototype.assignTask = function (teamId, taskId, userId, cb) {
        this._callApi('assignTask', arguments);
    };
    
    // Unassigns a task. This can only be done if the task is already part of a project. Since all tasks must have an assignee or a related project.
    AndBang.prototype.unassignTask = function (teamId, taskId, cb) {
        this._callApi('unassignTask', arguments);
    };
    
    // Deletes a task completely.
    AndBang.prototype.deleteTask = function (teamId, taskId, cb) {
        this._callApi('deleteTask', arguments);
    };
    
    // In And Bang we call completing a task &quot;shipping&quot;. This method does that.
    AndBang.prototype.shipTask = function (teamId, taskId, cb) {
        this._callApi('shipTask', arguments);
    };
    
    // Create a new task and add it to my list.
    AndBang.prototype.createTaskForMe = function (teamId, taskAttributes, cb) {
        this._callApi('createTaskForMe', arguments);
    };
    
    // Create a new task and add it to your teammates&#39;s list
    AndBang.prototype.createTaskForTeammate = function (teamId, userId, taskAttributes, cb) {
        this._callApi('createTaskForTeammate', arguments);
    };
    
    // Gets all current tasks for team.
    AndBang.prototype.getAllTasks = function (teamId, cb) {
        this._callApi('getAllTasks', arguments);
    };
    
    // Get all the tasks for a given team member.
    AndBang.prototype.getMemberTasks = function (teamId, userId, cb) {
        this._callApi('getMemberTasks', arguments);
    };
    
    // Get all the tasks that have been assigned to this person by someone else on this team.
    AndBang.prototype.getMemberAssignedTasks = function (teamId, userId, cb) {
        this._callApi('getMemberAssignedTasks', arguments);
    };
    
    // Get all the tasks that have been deferred by (or for) this person on this team.
    AndBang.prototype.getMemberLateredTasks = function (teamId, userId, cb) {
        this._callApi('getMemberLateredTasks', arguments);
    };
    
    // Get tasks this person has shipped.
    AndBang.prototype.getMemberShippedTasks = function (teamId, userId, cb) {
        this._callApi('getMemberShippedTasks', arguments);
    };
    
    // Get the tasks this person is watching.
    AndBang.prototype.getMemberWatchedTasks = function (teamId, userId, cb) {
        this._callApi('getMemberWatchedTasks', arguments);
    };
    
    // Get the task this person is working on.
    AndBang.prototype.getMemberActiveTask = function (teamId, userId, cb) {
        this._callApi('getMemberActiveTask', arguments);
    };
    
    // Create a new project.
    AndBang.prototype.createProject = function (teamId, projectAttributes, cb) {
        this._callApi('createProject', arguments);
    };
    
    // Update project attributes.
    AndBang.prototype.updateProject = function (teamId, projectId, projectAttributes, cb) {
        this._callApi('updateProject', arguments);
    };
    
    // Delete a project. As a safeguard, this can only be done if all the tasks are deleted first.
    AndBang.prototype.deleteProject = function (teamId, projectId, cb) {
        this._callApi('deleteProject', arguments);
    };
    
    // List projects.
    AndBang.prototype.getProjects = function (teamId, cb) {
        this._callApi('getProjects', arguments);
    };
    
    // Get all the tasks in a given project
    AndBang.prototype.getProjectTasks = function (teamId, projectId, cb) {
        this._callApi('getProjectTasks', arguments);
    };
    
    // Get a given member on the team.
    AndBang.prototype.getMember = function (teamId, userId, cb) {
        this._callApi('getMember', arguments);
    };
    
    // Get members on the team.
    AndBang.prototype.getMembers = function (teamId, cb) {
        this._callApi('getMembers', arguments);
    };
    
    // Get details about a single invitation
    AndBang.prototype.getInvite = function (teamId, inviteId, cb) {
        this._callApi('getInvite', arguments);
    };
    
    // Get array of everybody who has been invited to the team
    AndBang.prototype.getInvites = function (teamId, cb) {
        this._callApi('getInvites', arguments);
    };
    
    // Create a new invitation to add someone to your team.
    AndBang.prototype.createInvite = function (teamId, inviteeEmailAddress, cb) {
        this._callApi('createInvite', arguments);
    };
    
    // Re-send and existing invitation
    AndBang.prototype.resendInvite = function (teamId, inviteId, cb) {
        this._callApi('resendInvite', arguments);
    };
    
    // Accept an invitation to join a team.
    AndBang.prototype.acceptInvite = function (teamId, inviteId, cb) {
        this._callApi('acceptInvite', arguments);
    };
    
    // Delete an invitation. Makes invitation unusable if someone tries to use it to join the team.
    AndBang.prototype.deleteInvite = function (teamId, inviteId, cb) {
        this._callApi('deleteInvite', arguments);
    };
    
    // Creates a new chat.
    AndBang.prototype.startChat = function (teamId, chatAttributes, cb) {
        this._callApi('startChat', arguments);
    };
    
    // Destroys a chat room
    AndBang.prototype.endChat = function (teamId, chatId, cb) {
        this._callApi('endChat', arguments);
    };
    
    // Add a user to a chat.
    AndBang.prototype.addUserToChat = function (teamId, chatId, userId, cb) {
        this._callApi('addUserToChat', arguments);
    };
    
    // Returns the users currently in the chat.
    AndBang.prototype.getUsersInChat = function (teamId, chatId, cb) {
        this._callApi('getUsersInChat', arguments);
    };
    
    // Removes a user from the chat.
    AndBang.prototype.removeMemberFromChat = function (teamId, chatId, userId, cb) {
        this._callApi('removeMemberFromChat', arguments);
    };
    
    // Sets the subject of the chat.
    AndBang.prototype.setSubjectOfChat = function (teamId, chatId, subject, cb) {
        this._callApi('setSubjectOfChat', arguments);
    };
    
    // Gets the current subject of the chat.
    AndBang.prototype.getSubjectOfChat = function (teamId, chatId, subject, cb) {
        this._callApi('getSubjectOfChat', arguments);
    };
    
    // Sends a chat message to the room.
    AndBang.prototype.sendChatMessage = function (teamId, chatId, message, cb) {
        this._callApi('sendChatMessage', arguments);
    };
    
    // Get the past chat messages.
    AndBang.prototype.getChatHistory = function (teamId, chatId, cb) {
        this._callApi('getChatHistory', arguments);
    };
    
    // Search within the chat.
    AndBang.prototype.searchChatHistory = function (teamId, chatId, cb) {
        this._callApi('searchChatHistory', arguments);
    };
    

    // attach to windor or export with commonJS
    if (typeof exports !== 'undefined') {
        module.exports = AndBang;
    } else {
        root.AndBang = AndBang;
    }

}).call(this);
