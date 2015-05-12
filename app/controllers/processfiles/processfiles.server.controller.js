'use strict';

/**
 * Module dependencies.
 */
 var _ = require('lodash');
 var express = require('express');
 var jf = require('jsonfile')
 var util = require('util')
 




/**
 * Update user details
 */
exports.process = function(req, res) {
	// Init Variables
	// var user = req.user;
	// var message = null;
	console.log('processin\'...');
	//res.json('hola! ke hase?');


	var helpers = {
		getTitle: function(event_title, event_title1, event_title2) {
			var title = '';
			var hyphen = '';
			// if there is only one general title element, write it into title
			if ((typeof event_title) !== "undefined") {
					title = obj.event_title;
			} else {
				// if there is a title1 element, write it into title and prepare hyphen in case there is more
				if (((typeof event_title1) !== "undefined") && (event_title1 !== '')) {
					title = event_title1;
					hyphen = ' - ';
				}
				// if there is a title2 element, add the hyphen (can be empty) and add title2 to title
				if (((typeof event_title2) !== "undefined") && (event_title2 !== '')) {
					title += hyphen;
					title += event_title2;
				}
			}
			return title;
		},
		makeDescription: function(event_image-src, event_title, event_text, event_link-href) {
			var description = '';
			var title = '';
			if ((typeof event_title) !== "undefined")  {
				title = event_title;
			}
			if ((typeof event_image-src) !== "undefined") {
				description = "<img src='" + event_image-src + "' width='228' height='182' alt='" + title + "' />";
			}
			if ((typeof event_text) !== "undefined") {
				description += "<p>" + event_text + "</p>";
			}
			if ((typeof event_link-href) !== "undefined") {
				description += "<p><a href='" + event_link-href + "' target='_blank'>+info</a></p>";
			}
			return description;
		}
	 }

	var file = 'json/04-05-2015/artbcn_events.json'
	//console.log(util.inspect(jf.readFileSync(file)))
	var myObj = jf.readFileSync(file);
	console.log(myObj[0].event_title1);
	var test = myObj[0].event_title3;
	console.log('inexistent: ' + test);
};

/**
 * Send User
 */
