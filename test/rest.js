/*global describe, it */
var API = this.module.exports,
    assert = require('assert'),
    qs = require('querystring'),
    token = 'wooo',
    tokenHeader = 'Authorization',
    s = function (obj) {
        return JSON.stringify(obj, null, 2);
    },
    getHeaders = function () {
        var retVal = {};
        retVal[tokenHeader] = 'Bearer ' + token;
        return retVal;
    };

var api = new API({
    useREST: true,
    token: token
});

var expected = function (method, path, data) {
    data = data || {};
    var obj = {
        method: method,
        headers: getHeaders(),
        url: api.http.url + path,
        strictSSL: true
    };

    if (method === 'GET') {
        obj.qs = qs.stringify(data);
    } else {
        obj.body = data;
        obj.json = true;
    }

    return s(obj);
};



describe('Get me', function () {

    it('should have the correct request for a GET', function (done) {
        api.http.getMe(function (err, res) {
            assert.equal(expected('GET', '/me'), s(res));
            done();
        });
    });

});

describe('Update me', function () {

    it('should have the correct request for a PUT', function (done) {
        var request = {
            name: 'woo'
        };
        api.http.updateMe(request, function (err, res) {
            assert.equal(expected('PUT', '/me', request), s(res));
            done();
        });
    });

});

describe('Get direct chat', function () {

    it('should have the correct request for a GET', function (done) {
        api.http.getDirectChatHistory(1, 3, function (err, res) {
            assert.equal(expected('GET', '/teams/1/chat/3'), s(res));
            done();
        });
    });

    it('should have the correct request for a GET with attributes', function (done) {
        var request = {
            name: 'woo'
        };
        api.http.getDirectChatHistory(1, 3, request, function (err, res) {
            assert.equal(expected('GET', '/teams/1/chat/3', request), s(res));
            done();
        });
    });

});

describe('Update task', function () {

    it('should have the correct request without optional param', function (done) {
        api.http.updateTask(1, 3, function (err, res) {
            assert.equal(expected('PUT', '/teams/1/tasks/3'), s(res));
            done();
        });
    });

    it('should have the correct request with optional param', function (done) {
        var request = {
            name: 'woo'
        };
        api.http.updateTask(1, 3, request, function (err, res) {
            assert.equal(expected('PUT', '/teams/1/tasks/3', request), s(res));
            done();
        });
    });

});

describe('Clear notifications', function () {

    it('should have the correct request for a DELETE', function (done) {
        api.http.clearMyNotifications(1, function (err, res) {
            assert.equal(expected('DELETE', '/teams/1/me/notifications'), s(res));
            done();
        });
    });

});


describe('Create task', function () {

    it('should have the correct request for a POST', function (done) {
        var request = {
            title: 'test'
        };
        api.http.createTaskForMe(1, request, function (err, res) {
            assert.equal(expected('POST', '/teams/1/me/tasks', request), s(res));
            done();
        });
    });

});

