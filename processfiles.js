'use strict';
/**
 * Module dependencies.
 */

var processfiles = require('./app/controllers/processfiles/processfiles.server.controller');
var path = process.argv[2] || 'testfolder'

processfiles.process(path);