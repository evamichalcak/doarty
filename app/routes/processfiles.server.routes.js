'use strict';

module.exports = function(app) {
	// Root routing
	var processfiles = require('../../app/controllers/processfiles/processfiles.server.controller');
	app.route('/processfiles').get(processfiles.process);
	// var users = require('../../app/controllers/users.server.controller');
	// app.route('/users/me2').get(users.me);
};