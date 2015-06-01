'use strict';
/**
 * Module dependencies.
 */

var processfiles = require('./app/controllers/processfiles/processfiles.server.controller');
var dirname = process.argv[2] || 'testfolder'

processfiles.process(dirname);