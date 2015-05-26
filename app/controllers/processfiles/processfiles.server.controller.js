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
		checkKey: function(key) { //tested
			// returns true if a key is defined and not empty
			if (((typeof key) !== "undefined") && (key !== '')) {
					return true;
			} else {
				return false;
			}
		},
		getValuesFromKey: function(key) { //tested
			// returns comma-separated string of values attached by "__" to a keyname
			var valuePair = [];
			var valArray = key.split('__');
			valuePair[0] = valArray.shift();
			if (valArray.length > 0) {
				valuePair[1] = valArray.join(', ');
			}
			return valuePair;
		},
		addPropertiesFromKeys: function(obj) {
			// finds all compound keys "key-name__key-value" on an object, adds the key-name as new property with the key-value as value and removes compound key
			var arr = [];
			for (var key in obj) {
				if (key.indexOf('__') > 0) {
					arr = this.getValuesFromKey(key);
					obj[arr[0]] = arr[1];
					delete obj[key];
				}	
			}
			return obj;
		},
		mergeObjects: function(obj1, obj2) { //tested
			// for two objects with identical keys returns new object with the value of object one, and if that is empty string, of object two
			var newObj = {};
			for (var key in obj1) {
				if (obj1[key] == '') {
					newObj[key] = obj2[key];
				} else {				
					newObj[key] = obj1[key];
				}
			}
			return newObj;
		},
		findAllIndices: function(JSONarray, keyId, keyValue) { //tested
			// returns an array with all indices for a given Id/Value pair
			// @TODO improve using splice -> return subarray
			var indices = [];
			var len = JSONarray.length;
			for (var i = 0; i < len; i++) {
				if (JSONarray[i][keyId] == keyValue) {
					indices.push(i);
				}
			}
			return indices;
		},
		cherrySplice: function(JSONarray, indices) { //tested
			// splices an array for a all given indices and return an array of the cut-out elements
			var tempElem;
			var tempArray = []; 
			// function for numeric sort of array
			function sortNumber(a,b) {
			    return a - b;
			}
			// sort indices
			indices.sort(sortNumber);
			for (var i = indices.length-1; i >= 0; i--) {
				//create subarray splicing out the found objects
				if (indices[i] >= JSONarray.length) {
					console.log("index out of range.")
				} else {
					tempElem = JSONarray.splice(indices[i], 1);
					tempArray.push(tempElem[0]);
				}
			}
			return tempArray;
		},
        getMiddleChar: function(str, chr) { //tested
            // for a given character in a string, find all occurences and return the index of the middle occurence if odd, and first occurenc of second half if even
            var indices = [];
            var pos;
            // find occurrences indices
            for(var i=0; i<str.length;i++) {
                if (str[i] === chr) indices.push(i);
            }
            // find middle
            if (indices.length > 0) {
                pos = Math.floor(indices.length/2);
                return indices[pos];
            } else {
                return -1;
            }
        },
        isDoubleDate: function(dateString, separator) { //tested
            // determines wether a date is a double date by checking if the number of dashes is odd and return middle dash position
            // set letter separator to default " al" if not set
            var separator = separator || " al";
            // count number of dashes with split
            var h = dateString.split("-");
            var dashes = (h.length - 1);
            if ((dashes % 2) == 1) {                
                return this.getMiddleChar(dateString, "-");
            } else {
                return dateString.indexOf(separator);
            }
        },
        cleanDoubleDate: function(str) { // tested
            // splits a string in two at the middle occurence of a dash
            var dates = [];
            var pos;
            pos = helpers.isDoubleDate(str);
            if (pos < 0) {
				dates[0] = str;
            } else {
				dates[0] = str.slice(0, pos);
				dates[1] = str.slice(pos + 1);
            }
            return dates;
        },
        convertNumberDate: function(str) { //tested
        	// splits string by common date separators ("/", "-", ".") and returns an object with day-month-year
            var arr = [];
            var separator = '/';
            if (str.indexOf('/') < 0 ) {            
	            if (str.indexOf('-') >= 0 ) {
	                separator = '-';
	            } else if (str.indexOf('.') >= 0 ) {
	                separator = '.';
	            }
	        }
            arr = str.split(separator);
            arr[0] = parseInt(arr[0]);
            arr[1] = parseInt(arr[1]) || "";
            arr[2] =parseInt(arr[2]) || "";
            return { "day": arr[0], "month": arr[1], "year": arr[2] };
        },
        convertLetterDate: function(str) { //tested
        	// finds 3-letter code of month (es-ES, ca-ES, en-US) in a string and returns corresponding month number
        	function makeDateObject(month, code, string) {
        		var helperArray = [];
        		var resultArray = [];
        		var h;
        		string = string.toLowerCase();
        		if (string.indexOf(code) < 0) {
        			//string does not contain a month and must be the first part of a double date of type "1 - 15 Mayo": the string is the day
        			resultArray[0] = parseInt(string.match(/[0-9]+/));
        			resultArray[1] = "";
        			resultArray[2] = "";
        		}
        		if (string.indexOf(code) == 0) {
        			// month is first, checking for anglosaxon date formats with day after month
        			if (string.match(/[0-9]+st/)) {
        				helperArray = string.split('st');
        			} else if (string.match(/[0-9]+nd/)) {
        				helperArray = string.split('nd');
        			} else if (string.match(/[0-9]+rd/)) {
        				helperArray = string.split('rd');
        			} else if (string.match(/[0-9]+th/)) {
        				helperArray = string.split('th');
        			}
        			if (helperArray.length > 0) {
        				// there was a split performed on an anglosaxon date format
        				if (helperArray.length > 2) {
        					// if an erroneous split occured like with auguST, remove it
        					helperArray.pop();
        				}
        			} else  {
        				console.log("No day found");
        			}        			 			
        		} else {
        			// normal day-month-year format, splitting on month
        			helperArray = string.split(code);
        		}
        		resultArray[0] = parseInt(helperArray[0].match(/[0-9]+/));
    			resultArray[1] = month;
    			h = parseInt(helperArray[1].match(/[0-9]+/));
    			if (isNaN(h)) {
    				resultArray[2] = "";   
    			} else {
    				resultArray[2] = h;   
    			}
            	return { "day": resultArray[0], "month": resultArray[1], "year": resultArray[2] };
        	}

        	switch (true) {
				case /ene/i.test(str):
					return makeDateObject(1, "ene", str) ;
					break;
				case /gen/i.test(str):
					return makeDateObject(1, "gen", str) ;
					break;
				case /jan/i.test(str):
					return makeDateObject(1, "jan", str) ;
					break;
				case /feb/i.test(str):
					return makeDateObject(2, "feb", str) ;
					break;
				case /mar/i.test(str):
					return makeDateObject(3, "mar", str) ;
					break;
				case /abr/i.test(str):
					return makeDateObject(4, "abr", str) ;
					break;
				case /apr/i.test(str):
					return makeDateObject(4, "apr", str) ;
					break;
				case /may/i.test(str):
					return makeDateObject(5, "may", str) ;
					break;
				case /mai/i.test(str):
					return makeDateObject(5, "mai", str) ;
					break;
				case /jun/i.test(str):
					return makeDateObject(6, "jun", str) ;
					break;
				case /jul/i.test(str):
					return makeDateObject(7, "jul", str) ;
					break;
				case /ago/i.test(str):
					return makeDateObject(8, "ago", str) ;
					break;
				case /aug/i.test(str):
					return makeDateObject(8, "aug", str) ;
					break;
				case /sep/i.test(str):
					return makeDateObject(9, "sep", str) ;
					break;
				case /set/i.test(str):
					return makeDateObject(9, "set", str) ;
					break;
				case /oct/i.test(str):
					return makeDateObject(10, "oct", str) ;
					break;
				case /nov/i.test(str):
					return makeDateObject(11, "nov", str) ;
					break;
				case /dic/i.test(str):
					return makeDateObject(12, "dic", str) ;
					break;
				case /des/i.test(str):
					return makeDateObject(12, "des", str) ;
					break;
				case /dec/i.test(str):
					return makeDateObject(12, "dec", str) ;
					break;
				default:
					//string does not contain a month and must be the first part of a double date of type "1 - 15 Mayo": the string is the day
					return { "day": parseInt(str.match(/[0-9]+/)), "month": "", "year": "" } ;
					break;
		    }
        },
        formatDate: function(dateObject) { //tested
        	// turns a dateObject with day, month and year properties into a string with the format mm/dd/yyyy
        	var dateString = "";
        	var y;
        	if (dateObject.month < 10) {
        		// padding month with 0
        		dateString += "0";
        	}
        	dateString += dateObject.month + "/";
        	if (dateObject.day < 10) {
        		// padding day with 0
        		dateString += "0";
        	}
        	dateString += dateObject.day + "/";
        	y = dateObject.year + "";
        	if (y.length < 4) {
        		//completeing year number
        		y = dateObject.year + 2000;
        	}
        	dateString += y;
        	return dateString;
        },
		processDate: function(start_date, end_date) { //tested
            // check for double date, convert dates and format them, returning an array with start and end date
            var arr = [];
            var start_dateObj = {};
            var end_dateObj = {};
            var current_year;
            if (!(end_date) || (start_date === end_date)) {
            	//check for double date and return splitted date
                arr = this.cleanDoubleDate(start_date);
                start_date = arr[0];
                // if there is no second date, asign empty string
                end_date = arr[1] || "";
            }

            // convert start date string to object 
            if (/[a-z]/i.test(start_date)) {
            	start_dateObj = this.convertLetterDate(start_date);
            } else {
            	start_dateObj = this.convertNumberDate(start_date);
            }
        
            // if there is an end date
            if (end_date !== "") {
            	// convert end date string to object 
	            if (/[a-z]/i.test(end_date)) {
	            	end_dateObj = this.convertLetterDate(end_date);
	            } else {
	            	end_dateObj = this.convertNumberDate(end_date);
	            }
	            // if start date has no year, fill it with end date year
	            if (start_dateObj.year == "") {
	            	if (end_dateObj.year == "") {
	            		// if end date has no year, fill it with current year
	            		current_year = new Date().getFullYear();
	            		end_dateObj.year = current_year;
	            	}
	            	start_dateObj.year = end_dateObj.year;
	            }
	            // if start date has no month, fill it with end date month
	            if (start_dateObj.month == "") {
	            	start_dateObj.month = end_dateObj.month;
	            }
	            // format end date
	            end_date = this.formatDate(end_dateObj);
            } else {
            	// there is no end date
            	if (start_dateObj.year == "") {
            		// if there is no year, fill it with current year
            		current_year = new Date().getFullYear();
            		start_dateObj.year = current_year;
	            }
            }	
            // format start date            
            start_date = this.formatDate(start_dateObj);
            return [start_date, end_date];
		},
		deduplicateByKey: function(JSONarray, key) { //tested
			var indices = [];
			var tempArray = [];
			//var len = JSONarray.length;
			var temp1, temp2;
			var that = this;
			for (var i = 0; i < JSONarray.length; i++) {
				//find all duplicates of current object
				indices = this.findAllIndices(JSONarray, key, JSONarray[i][key]);
				//create subarray by cherrySplicing array
				tempArray = this.cherrySplice(JSONarray, indices);
				//merge all objects in tempArray
				temp2 = tempArray.reduce(function(previousValue, currentValue, index, array) {
					if (previousValue === "undefined") {
						return currentValue;
					} else {
						return that.mergeObjects(previousValue, currentValue);
					}
				    
				});
				//push deduplicated and merged object back to JSONarray
				JSONarray.push(temp2);
			}
			return JSONarray;
		},
		getTitle: function(event_title, event_title1, event_title2) { //tested
			// returns title if title exists, otherwise joins title1 and title2 (with a hyphen, if both have values)
			var title = '';
			var hyphen = '';
			// if there is only one general title element, write it into title
			if (this.checkKey(event_title)) {
					title = event_title;
			} else {
				// if there is a title1 element, write it into title and prepare hyphen in case there is more
				if (this.checkKey(event_title1)) {
					title = event_title1;
					hyphen = ' - ';
				}
				// if there is a title2 element, add the hyphen (can be empty) and add title2 to title
				if (this.checkKey(event_title2)) {
					title += hyphen;
					title += event_title2;
				}
			}
			return title;
		},
		makeDescription: function(event_image, event_title, event_text, event_link) { //tested
			// constructs descirption text of the format: <img src='event_image' width='228' height='182' alt='title' /><p>event_text</p><p><a href='event_link' target='_blank'>+info</a></p>
			var description = '';
			var title = '';
			if (this.checkKey(event_title)) {
				title = event_title;
			}
			if (this.checkKey(event_image)) {
				description = "<img src='" + event_image + "' width='228' height='182' alt='" + title + "' />";
			}
			if (this.checkKey(event_text)) {
				description += "<p>" + event_text + "</p>";
			}
			if (this.checkKey(event_link)) {
				description += "<p><a href='" + event_link + "' target='_blank'>+info</a></p>";
			}
			return description;
		},
		formatEventObject: function(obj) {
			// loads a scraped object and formats it for CSV import
			var eventObj = {};
			var arr = [];

			// get properties from compound keys "key-name__key-value"
			obj = this.addPropertiesFromKeys(obj);

			// add base-url if necessary
			if (obj.hasOwnProperty('event_base-url')) {
				eventObj['event_link'] = obj.event_base-url;
			} 
			// add event_link
			eventObj['event_link'] += obj.event_link-href;

			// addevent_title
			eventObj['event_title'] = this.getTitle(obj['event_title'], obj['event_title1'], obj['event_title2']);

			// add event_description
			eventObj['event_description'] = this.makeDescription(obj['event_image-src'], eventObj['event_title'], obj['event_text'], eventObj['event_link']);

			// get both formatted dates
			arr = this.processDate(obj['event_start'], obj['event_end']);
			// add event_start
			eventObj['event_start'] = arr[0];
			// add event_end
			eventObj['event_end'] = arr[1];

			// add event_category
			eventObj['event_category'] = obj.event_category;

			// add event_maplink
			eventObj['event_maplink'] = obj.event_maplink;

			// add event_organizer
			eventObj['event_organizer'] = obj.event_organizer;

			// add event_venue
			eventObj['event_venue'] = obj.event_venue;

			// add event_cost
			eventObj['event_cost'] = obj.event_cost;

			// return the newly created object
			return eventObj;
		},
		processAll: function(JSONarray) {
			// deduplicate JSONarray, format objects and pass them to a new JSON
			var len, obj;
			var eventArr = [];
			// deduplicate
			JSONarray = this.deduplicateByKey(JSONarray, 'event_id');

			len = JSONarray.length;
			for (var i = 0; i < len; i++) {
				// format object
				obj = this.formatEventObject(JSONarray[i]);
				// add object to new array
				eventArr.push(obj);
			}
			return eventArr;
		}
	 }

	 var test1 = {
		"event_link": "",
		"event_title": "Title",
		"event_image": "",
		"event_text": "Bla bla bla...",
		"event_cost__5" : "56",
		"event_categories__Exposición__Galería": "eude"
	};

	var test2 = {
		"event_link": "href",
		"event_title": "Title",
		"event_image": "test.jpg",
		"event_text": "",
		"event_cost__5" : false,
		"event_categories__Exposición__Galería": null
	};

	var test3 = [
		{"event_id" : "http://www.w3schools.com/jsref/jsref_splice.asp"},
		{"event_id" : "333",
		 "event_link" : "http://www.w3schools.com/jsref/jsref_splice.asp"},
		{"event_id" : "444"},
		{"event_id" : "http://www.w3schools.com/jsref/jsref_splice.asp"},
		{"event_id" : "http://www.w3schools.com/jsref/jsref_splice.asp"},
		{"event_id" : "555"}
	];

	var test4 = [
		{
			"event_id" : "http://www.w3schools.com/jsref/jsref_splice.asp",
			"event_text" : "",
			"event_title" : ""
		},
		{
			"event_id" : "333",
		 	"event_link" : "http://www.w3schools.com/jsref/jsref_splice.asp",
			"event_text" : "My Text",
			"event_title" : "My Title"
		},
		{
			"event_id" : "444",
			"event_text" : "My Text4a",
			"event_title" : ""
		},
		{
			"event_id" : "http://www.w3schools.com/jsref/jsref_splice.asp",
			"event_text" : "My Text2a",
			"event_title" : "My Title2b"
		},
		{
			"event_id" : "http://www.w3schools.com/jsref/jsref_splice.asp",
			"event_text" : "",
			"event_title" : "My Title3b"
		},
		{
			"event_id" : "444",
			"event_text" : "",
			"event_title" : "My Title4b"
		}
	];
	

var test5 = [
{
    "event_maplink__1": "null",
    "event_img-src": "http://www.artbarcelona.es/wp-content/uploads/2015/04/BIPA2015_Daesung_Lee_Futuristic_Archeology1.jpg",
    "event_location": "Galería Valid Foto Bcn",
    "event_link": "",
    "event_link-href": "http://www.artbarcelona.es/es/exposiciones/barcelona-international-photography-awards-bipa-2015-es/",
    "event_title1": "Colectiva",
    "event_start": "",
    "event_end": "25.04.15 – 30.05.15",
    "event_organizer": "Galería Valid Foto Bcn",
    "event_title2": "Barcelona International Photography Awards, BIPA 2015",
    "event_text": "Exposición de los ocho fotógrafos ganadores del concurso Barcelona International Photography Awards, BIPA 2015 seleccionados por un jurado internacional entre más de 1000 portafolios presentados.",
    "event_cost__0": "null",
    "event_category__Exposición__Galería": "null"
}, 
{
    "event_maplink__1": "null",
    "event_img-src": "http://www.artbarcelona.es/wp-content/uploads/2015/03/PALMADOTZE.-Imatge.-targeto.Paisatges-lestigma-dall---social.IMG_2221.jpg",
    "event_location": "PALMADOTZE",
    "event_link": "",
    "event_link-href": "http://www.artbarcelona.es/es/exposiciones/paisajes-el-estigma-de-lo-social/",
    "event_title1": "Guillem Bayo, Alfonso Borragán, Alicia Kopf, Andrea Mármol, Mateo Maté, Mariona Moncunill, Xavi Muñoz, Patricio Palomeque, Joaquín Segura",
    "event_start": "",
    "event_end": "",
    "event_organizer": "PALMADOTZE",
    "event_title2": "Paisajes. El estigma de lo social",
    "event_text": "El paisaje siempre ha estado allí y aquí. Acompañándonos en todo lo que sucede. Adquiriendo también morfologías concretas y creando, a la vez, un nuevo paisaje que susurra a aquél originario que lo ha visto nacer. El rumor se hace presente también por ausencia y distancia.\nSon estos paisajes los que encontramos reunidos en esta muestra. Pasajes naturales que se pierden en la memoria, paisajes culturales, urbanos, domésticos, fantasmagóricos e incluso, sonoros. A través de diferentes formatos (audiovisuales, electrónicos, plásticos, literarios, etc.) nos vienen al encuentro paisajes de un tiempo contemporáneo y que vienen a secuestrar un fragmento de tiempo y, de alguna manera, rememoran el vacío de lo que se desvanece.",
    "event_cost__0": "null",
    "event_category__Exposición__Galería": "null"
}, 
{
    "event_maplink__1": "null",
    "event_img-src": "http://www.artbarcelona.es/wp-content/uploads/2015/03/PALMADOTZE.-Imatge.-targeto.Paisatges-lestigma-dall---social.IMG_2221.jpg",
    "event_location": "",
    "event_link": "",
    "event_link-href": "http://www.artbarcelona.es/es/exposiciones/paisajes-el-estigma-de-lo-social/",
    "event_title1": "Guillem Bayo, Alfonso Borragán, Alicia Kopf, Andrea Mármol, Mateo Maté, Mariona Moncunill, Xavi Muñoz, Patricio Palomeque, Joaquín Segura",
    "event_start": "",
    "event_end": "11.04.15 – 31.07.15",
    "event_organizer": "",
    "event_title2": "Paisajes. El estigma de lo social",
    "event_text": "El paisaje siempre ha estado allí y aquí. Acompañándonos en todo lo que sucede. Adquiriendo también morfologías concretas y creando, a la vez, un nuevo paisaje que susurra a aquél originario que lo ha visto nacer. El rumor se hace presente también por ausencia y distancia.\nSon estos paisajes los que encontramos reunidos en esta muestra. Pasajes naturales que se pierden en la memoria, paisajes culturales, urbanos, domésticos, fantasmagóricos e incluso, sonoros. A través de diferentes formatos (audiovisuales, electrónicos, plásticos, literarios, etc.) nos vienen al encuentro paisajes de un tiempo contemporáneo y que vienen a secuestrar un fragmento de tiempo y, de alguna manera, rememoran el vacío de lo que se desvanece.",
    "event_cost__0": "null",
    "event_category__Exposición__Galería": "null"
}, 
{
    "event_maplink__1": "null",
    "event_img-src": "http://www.artbarcelona.es/wp-content/uploads/2015/03/Angels_Tristan_Perich_Interval_Study_1_c.jpg",
    "event_location": "àngels barcelona",
    "event_link": "",
    "event_link-href": "http://www.artbarcelona.es/es/exposiciones/sounding-bits-un-projecto-comisariado-por-lluis-nacenta-con-la-colaboracin-de-lauditori-de-barcelona/",
    "event_title1": "Tristan Perich",
    "event_start": "",
    "event_end": "11.03.15 – 11.05.15",
    "event_organizer": "àngels barcelona",
    "event_title2": "Sound in Bits",
    "event_text": "Un proyecto comisariado por Lluis Nacenta con la colaboración de el Auditori de Barcelona\nTristan Perich compagina en su obra las artes visuales y la música, y en ambos campos pugna por hacer visible y audible la interrelación del código lógico con la impresión sensorial. A medio camino entre la simplicidad del orden matemático y la complejidad del mundo orgánico, sus dibujos e instalaciones sonoras hacen visible y audible el proceso de su propia realización. La pieza Octave se incluye en la exposición en colaboración con el ciclo Sampler Series de L'Auditori. Los Machine Drawings se exponen por primera vez en España.\nPrimera exposición indiviual en España de Tristan Perich, que en 2013 fue seleccionado para \"Soundings\": primera gran exposición del MoMA sobre arte sonoro y en la que se mostraban los trabajos de los artistas contemporáneos más innovadores trabajando con sonido. Sus trabajos anteriores también se han presentado en Nueva York en el Museo Whitney, el P.S.1/MoMA, The Kitchen o bitforms gallery, además de en el Mass MoCA, North Adams, la LABoral, Gijón, y Sonar, Barcelona, entre otros muchos espacios reconocidos por su trabajo con arte multimedia.\nLluís Nacenta es profesor, ensayista y comisario en los campos de la música y el diseño sonoro. Formado como matemático y pianista, combina los dos mundos en una mirada filosófica sobre las artes del sonido. Actualmente es profesor del Máster Universitario de Investigación en Arte y Diseño de Eina, Centre Universitari de Disseny i Art de Barcelona. Ha comisariado exposiciones y conciertos para el Festival Sónar, el Arts Santa Mònica, el Centre de Cultura Contemporània de Barcelona (CCCB) y la Fundació Antoni Tàpies, entre otros.",
    "event_cost__0": "null",
    "event_category__Exposición__Galería": "null"
}, 
{
    "event_maplink__1": "null",
    "event_img-src": "http://www.artbarcelona.es/wp-content/uploads/2015/04/XR_projecteSD.jpg",
    "event_location": "ProjecteSD",
    "event_link": "",
    "event_link-href": "http://www.artbarcelona.es/es/exposiciones/it-would-never-be-quite-the-same-again/",
    "event_title1": "Xavier Ribas",
    "event_start": "",
    "event_end": "17.04.15 – 26.05.15",
    "event_organizer": "ProjecteSD",
    "event_title2": "It Would Never Be Quite The Same Again",
    "event_text": "It Would Never Be Quite The Same Again es la tercera exposición individual de Xavier Ribas en ProjecteSD, en la que presenta una serie de obras relacionadas con su proyecto Nitrato, presentado en el Macba en junio de 2014 y que actualmente se puede visitar en The Bluecoat, Liverpool.\nDos negativos de un paisaje de América del Sur tomados en 1907 por Mabel Loomis Todd, y posteriormente fotografiados por Ribas en la biblioteca de la Universidad de Yale, sirven como punto de conexión entre las obras reunidas en Nitrato y la presente exposición.\nEl título de la exposición, It Would Never Be Quite The Same Again [Nunca volvería a ser exactamente lo mismo] –que coincide con el de una de las obras presentadas-, está tomado de las palabras pronunciadas por un juez en un tribunal para apoyar su veredicto al respecto del caso de una estatua de la ex primera ministra Margaret Thatcher que resultó decapitada por un activista. Estas palabras sirven a Xavier Ribas para tejer una constelación de historias de resistencia o actos de disidencia. Desarrolladas como fotografías de gran formato, junto a textos elaborados por el artista y copias de la documentación original, el trabajo de Ribas revisa una serie de hechos y documentos que son interpretados como ecos distantes de las detonaciones en los paisajes desérticos de Atacama durante el S. XIX, y que resuenan todavía en la historia reciente de Chile y Gran Bretaña.\nEl mensaje de la exposición podría ser que esta interrelación de casos dispersos –pequeños ejemplos de activismo, acción directa, gestos radicales, campañas solidarias- que cambian aparentemente nada o muy poco en nuestra realidad cotidiana, pueden sin embargo, por acumulación, servir de punto de inflexión para permitir el cambio en un futuro.",
    "event_cost__0": "null",
    "event_category__Exposición__Galería": "null"
}, 
{
    "event_maplink__1": "null",
    "event_img-src": "http://www.artbarcelona.es/wp-content/uploads/2015/04/Sergi-Mesa-_Sense-t--tol_Oli-sobre-lli_150-x-160-cm2.jpg",
    "event_location": "Galería Trama",
    "event_link": "",
    "event_link-href": "http://www.artbarcelona.es/es/exposiciones/modular-es/",
    "event_title1": "",
    "event_start": "",
    "event_end": "",
    "event_organizer": "Galería Trama",
    "event_title2": "",
    "event_text": "Natalia Baquero (Zaragoza, 1982) y Sergi Mesa (Manresa, 1987) presentan su primera exposición colectiva en Galeria Trama después de ser seleccionados en ediciones recientes del concurso de pintura y fotografía ART<35, que organizan anualmente Galeria Trama y Sala Parés. El título de la exposición Modular hace referencia al punto donde confluyen los universos pictóricos de los dos artistas:\nPor un lado, las obras de Natalia Baquero parten de la repetición de elementos pictóricos básicos (puntos, líneas o planos) y de la combinatoria constructiva que estos generan. Estos elementos actúan como “módulos” y su repetición progresiva se utiliza como elemento de búsqueda. Son obras que tratan sobre la investigación de las excepciones y de las nuevas posibilidades que surgen de estos procesos combinatorios.\nPor otro lado, Sergi Mesa modula otros elementos que dominan su obra: la forma, el color y los elementos icónicos que muchas veces aparecen. A través de sus pinturas, este artista nos transporta a nuevas realidades. Empleando formes básicas y primitivas pretende abrir nuevos horizontes, donde los límites los establece solo nuestra mente y aquello que seamos capaces de imaginar.",
    "event_cost__0": "null",
    "event_category__Exposición__Galería": "null"
}, 
{
    "event_maplink__1": "",
    "event_img-src": "http://www.artbarcelona.es/wp-content/uploads/2015/04/Sergi-Mesa-_Sense-t--tol_Oli-sobre-lli_150-x-160-cm2.jpg",
    "event_location": "Galería Trama",
    "event_link": "",
    "event_link-href": "http://www.artbarcelona.es/es/exposiciones/modular-es/",
    "event_title1": "Natalia Baquero & Sergi Mesa",
    "event_start": "",
    "event_end": "16.04.15 – 19.05.15",
    "event_organizer": "Galería Trama",
    "event_title2": "Modular",
    "event_text": "",
    "event_cost__0": "",
    "event_category__Exposición__Galería": "null"
}
];

var test6 = {"event_name": "My Event", "event_maplink__1": null, "event_category__Exposición__Galería": null};

var arr = ['Del 1 al 15 de mayo', '1 - 15 de febrero', '24 de desembre', '8th of August', 'Del 4 abril al 3 de mayo', '15-1-2015', '15-1-2014 - 16-2-2015', '11/12-13/01/2016', '28/05/2015', '14.10.2015']

	var file = 'json/04-05-2015/artbcn_events.json'
	//console.log(util.inspect(jf.readFileSync(file)))
	var myObj = jf.readFileSync(file);
	console.log(myObj[0].event_title1);
	//var test = myObj[0].event_title3;
	// console.log(helpers.cherrySplice(arr, [0,2,3]));
	// console.log(arr);
    console.log(helpers.addPropertiesFromKeys(test6));
    // arr[7] = arr[7] || "w";
    // console.log(arr[7]);
};

/*
 * Send User
 */
