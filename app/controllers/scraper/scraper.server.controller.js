'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');
 var express = require('express');
 var fs = require('fs');
 var Spooky = require('spooky');


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

	var read = {
		"events": {
			"meta" : {
				"prepend_href": "http://www.macba.cat"
			},
			"global" : {
				"event_category": [
					".box:first-child .agenda_data dd:last",
					".menu .selected a"
				],
				"event_maplink": "1",
				"event_organizer": ".box:first-child .agenda_data dd:last",
				"event_venue": ".box:first-child .agenda_data dd:last",
				"event_cost": "7"
			},
			"multiple" : {
				"select" : ".box",
				"collect" : {
					"event_href" : ".box h3 a",
					"event_title": ".box h3 a",
					"event_subtitle": ".box h3 em",
					"event_start" : ".agenda_data .slash",
					"event_end" : ".agenda_data span:not('.slash')",
					"event_img" : ".box .img img",
					"follow" : {
						"select" : ".box h3 a",
						"collect" : {
							"event_text" : ".box .text_box"
						}
					}
				}
			}
		}
	};


	var collectData = function(read) {
		console.log(read.events.multiple.select);
		
	}




	var example = {
		"event_href" : "http://www.macba.cat/es/expo-pasado-inquieto/1/exposiciones/expo",
		"event_title": "Pasado inquieto",
		"event_subtitle": "",
		"event_start" : "20 feb",
		"event_end" : "01 jun. 2015",
		"event_img" : "http://www.macba.cat/uploads/20141030/Invite.5.3.jpg",
		"event_text" : "La historia del arte contemporáneo no puede escribirse solo a través del análisis de obras de arte. Una disciplina historiográfica esencial para ello se dirige a investigar y narrar cómo las obras de arte han sido llevadas al ámbito del espacio público para su recepción. La historia de las exposiciones nos permite aprehender el lugar que la producción artística de nuestro tiempo concede al arte dentro del conjunto más amplio de condiciones políticas, mediáticas, económicas y culturales, esto es, cómo se construyen y se comparten los valores que el arte aporta a la vida.",
		"event_category": "MACBA, Exposicones",
		"event_maplink": "1",
		"event_organizer": "MACBA",
		"event_venue": "MACBA",
		"event_cost": "7",
	};


	var spooky = new Spooky({
        child: {
            transport: 'http'
        },
        casper: {
            logLevel: 'debug',
            verbose: true,
            options: {
		     clientScripts: ['../../../public/lib/jquery/distjquery.min.js']
		   	}
        }
    }, function (err) {
        if (err) {
            e = new Error('Failed to initialize SpookyJS');
            e.details = err;
            throw e;
        }

        spooky.start(url);
        spooky.then(function () {
        	var s = this.evaluate(function() {
		    	var titles = $('.box');
			   	 return Array.prototype.map.call(titles, function(e) {
				  
			    	return e.nodeValue;
		    	});
		});
            this.emit('hello', 'Hello, from ' + s.join('++'));
        });
        spooky.run();
    });

spooky.on('error', function (e, stack) {
    console.error(e);

    if (stack) {
        console.log(stack);
    }
});

/*
// Uncomment this block to see all of the things Casper has to say.
// There are a lot.
// He has opinions.
spooky.on('console', function (line) {
    console.log(line);
});
*/

spooky.on('hello', function (greeting) {
    console.log(greeting);
});

spooky.on('log', function (log) {
    if (log.space === 'remote') {
        console.log(log.message.replace(/ \- .*/, ''));
    }
});


};

/**
 * Send User
 */
