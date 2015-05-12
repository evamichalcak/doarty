'use strict';

/**
 * Module dependencies.
 */
 var _ = require('lodash');
 var express = require('express');
 var fs = require('fs');
 var request = require('request');
 var cheerio = require('cheerio');


/**
 * Update user details
 */
exports.scrape = function(req, res) {
	// Init Variables
	// var user = req.user;
	// var message = null;
	console.log('scrapin\'...');
	//res.json('hola! ke hase?');


	var url = 'http://www.macba.cat/es/exposiciones';
	
	var helpers = {
	 	getLink: function(elem) {
					return elem.attr('href');
				},

		addSingle: function(json, contentName, content) {
				return json[contentName] = content;
			},
		addMultiple: function(json, index, contentName, content) {
			return json[index][contentName] = content;
		}
	 };

	request(url, helpers, function(error, response, html){
		if(!error){
		 	var $ = cheerio.load(html);

		 	var link, title, rating;
		 	var json = [];

		 // 	$('#search .img a').each(function(i, elem){
		 //        link = $(this).attr('href');
		 //        console.log('link: '+ link);
		 //        json.link = link;
	  //       });

			// console.log('follow...');

		 // 	$('#search .tit a').filter(function(){
		 //        title = data.text();
		 //        json.title = title;
	  //       });

	        $('#search .img > a').each(function(ind, elem){
	        	var data = $(this);
	        	rating = helpers.getLink(data);
	        	json[ind] = {}
	        	helpers.addMultiple(json, ind, 'rating', rating);
	        });
		 }

		
		 

		// fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){
  //       	console.log('File successfully written! - Check your project directory for the output.json file');
  //       })

        res.send(json);
	});

	//app.listen('8081')
	console.log('Magic happens on port 8081');

};

/**
 * Send User
 */
