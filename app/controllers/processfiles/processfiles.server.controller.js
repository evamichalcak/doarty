'use strict';

/**
 * Module dependencies.
 */
 var _ = require('lodash');
 var express = require('express');
 var jf = require('jsonfile');
 var util = require('util');
 var jt = require('json-transcriber');
 //var csvconverter = require('json-2-csv');
 var fs = require('fs');
 
// config options
var aggregetorPluginFormat = true;


/**
 * Update user details
 */
//exports.process = function(req, res) {
exports.process = function(path) {
console.log('processin\'...');

var helpers = {
	checkKey: function(key) { //tested
		// returns true if a key is defined and not empty
		if (((typeof key) !== "undefined") && (key !== '') && (key !== 'null')) {
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
	addPropertiesFromKeys: function(obj) { //tested
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
			if ((obj1[key] == '') || (obj1[key] == 'null') || (obj1[key] == 'undefined')) {
				if ((obj2[key] == 'null') || (obj2[key] == 'undefined')) {
					newObj[key] = "";
				} else {
					newObj[key] = obj2[key];
				}
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
        } else if (dateString.indexOf("–") > 0) {
            return dateString.indexOf("–");
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

		// remove martes, in order not to trigger with 'mar' code
		str = str.replace(/ *\b\S*?martes\S*\b/g, '');
		str = str.replace(/ *\b\S*?Martes\S*\b/g, '');

    	function makeDateObject(month, code, string) {
    		var helperArray = [];
    		var resultArray = [1, 1, 1970];
    		var h;
    		string = string.toLowerCase();
    		if (string.indexOf(code) < 0) {
    			//string does not contain a month and must be the first part of a double date of type "1 - 15 Mayo": the string is the day
    			resultArray[0] = parseInt(string.match(/[0-9]+/));
    			resultArray[1] = "";
    			resultArray[2] = "";
    		}
    		if (/[a-z]/i.test(code)) {
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
	    				console.log("No day found, returning fallback 01/01/1970");

	    			}        			 			
	    		} else {
	    			// normal day-month-year format, splitting on month
	    			helperArray = string.split(code);
	    		}
	    		if (helperArray[0]) {
	    			resultArray[0] = parseInt(helperArray[0].match(/[0-9]+/));
	    		}
				resultArray[1] = month;
	    		if (helperArray[1]) {
					h = parseInt(helperArray[1].match(/[0-9]+/));
					if (isNaN(h)) {
						resultArray[2] = "";   
					} else {
						resultArray[2] = h;   
					}
	    		}
			} else {
				//code is either "." or "/": there is no text-month
				helperArray = string.split(code);
				resultArray[0] = parseInt(helperArray[0].match(/[0-9]+/));
				resultArray[1] = parseInt(helperArray[1]) || "";
				resultArray[2] =parseInt(helperArray[2]) || "";
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
			case /mär/i.test(str):
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
			case /okt/i.test(str):
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
			case /dez/i.test(str):
				return makeDateObject(12, "dec", str) ;
				break;
			default:
				var ta;
				if (str.indexOf('.')) {
					ta = str.split('.');
					return makeDateObject(parseInt(ta[1]), ".", str);
				} else if (str.indexOf('/')) {
					ta = str.split('/');
					return makeDateObject(parseInt(ta[1]), "/", str);
				} else {
					//string does not contain a month and must be the first part of a double date of type "1 - 15 Mayo": the string is the day
					return { "day": parseInt(str.match(/[0-9]+/)), "month": "", "year": "" } ;
				}
				break;
	    }
    },
    formatJSDate: function(jsDate) { 
    	// from a javascript Date returns a dateObject with day, month and year properties into a string with the format mm/dd/yyyy
    	var dateString = "";
    	dateString = ("0" + (jsDate.getMonth() + 1)).slice(-2) + "/" + ("0" + jsDate.getDate()).slice(-2) + "/" + jsDate.getFullYear();
    	return dateString;
    },
    formatDate: function(dateObject) { //tested
    	// from our custom dateObject returns a dateObject with day, month and year properties into a string with the format mm/dd/yyyy
    	var dateString = "";
    	var y;

    	// check days and months for NaN
    	if (isNaN(dateObject.day)) {
    		dateObject.day = 1;
    	}
    	if (isNaN(dateObject.month)) {
    		dateObject.month = 1;
    	}

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
	extractTime: function(date, separator) { 
		// this function is kind of custom made to extract time from dates formated by the events calendar plugin (scraping googletranslated sites...)
		// split start date on time separator and reassign startdate with first part of split (date)
		var tt, start_time, end_time;
		tt = date.split(separator);
		date = tt[0];
		// if there was a time, start extracting time
		if (tt.length > 1) {
    		start_time= tt[1];
    		// check for from to time
    		tt = start_time.split('-');
    		if (tt.length > 1) {
        		start_time= tt[0];
        		end_time = tt[1];
        	}
    	}
    	return [date, start_time, end_time]

	},
	processDate: function(start_date, end_date, separator) { //tested
        // check for double date, convert dates and format them, returning an array with start and end date
        // the time extracting part of the function is 
        var arr, tt = [];
        var start_dateObj = {};
        var end_dateObj = {};
        var current_year, start_time, end_time;
        if (!(end_date) || (end_date === 'null') || (start_date === end_date)) {
			// if a time separator has been passed, extract time from start date (for start-date-only events)
        	if (!(end_date) || (end_date === 'null') && separator) {
	        	tt = this.extractTime(start_date, separator);
	        	start_date = tt[0];
	        	start_time = tt[1];
	        	end_time = tt[2];
	        }
        	//check for double date and return splitted date
            arr = this.cleanDoubleDate(start_date);
            start_date = arr[0];
            // if there is no second date, asign empty string
            end_date = arr[1] || "";
        }

        // @todo check if a time separator has been provided, 
        // if yes, 
        //		check if both dates are the same
        //			split only first date, assign date and split time into start and end, assign
        // 		else split both dates in date and time, assign date and time

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
            // if start date has no year fill it in
            if (start_dateObj.year == "") {
            	if (end_dateObj.year == "") {
            		// if end date has no year, fill it with current year,
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
        return [start_date, end_date, start_time, end_time];
	},
	deduplicateByKey: function(JSONarray, key) { //tested
		var indices = [];
		var tempArray = [];
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
         	//prepend deduplicated and merged object back to JSONarray
			JSONarray.unshift(temp2);
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
		title = title.replace(/\n/g, " ");
		title = title.replace(/\t/g, " ");
		return title;
	},
    cleanImage: function(event_image) {
        // replaces https with http
        return event_image.replace(/^https:\/\//i, 'http://');;
    },
    makeDescription: function(event_image, event_title, event_text, event_link) { //tested
        // constructs descirption text of the format: <img src='event_image' width='228' height='182' alt='title' /><p>event_text</p><p><a href='event_link' target='_blank'>+info</a></p>
        var description = '<p>';
        var title = '';
        if (this.checkKey(event_title)) {
            title = event_title;
        }
        if (this.checkKey(event_image)) {
            description += "<img src='" + this.cleanImage(event_image) + "' width='228' height='182' alt='" + title + "' />";
        }
        if (this.checkKey(event_text)) {
            description += event_text;
        }
        description += "</p>";
        if (this.checkKey(event_link)) {
            description += "<p><a href='" + event_link + "' target='_blank'>+info</a></p>";
        }
        return description;
    },
	formatEventObject: function(obj) { //tested 
		// loads a scraped object and formats it for CSV import
		var eventObj = {};
		var arr = [];

		// get properties from compound keys "key-name__key-value"
		obj = this.addPropertiesFromKeys(obj);
		// add event_link with base-url if necessary
		if (this.checkKey(obj['event_base-url'])) {
			eventObj['event_link'] = obj['event_base-url'] + (obj['event_link-href'] || "");
		} else {
			eventObj['event_link'] = obj['event_link-href'];
		}
		
		// addevent_title
		eventObj['event_title'] = this.getTitle(obj['event_title'], obj['event_title1'], obj['event_title2']);

		// add event_description: if the full description is provided, assign it, else construct desctiptions out of image, link and text.

		if (this.checkKey(obj['event_full-description'])) {
			eventObj['event_description'] = obj['event_full-description']
		} else {
			eventObj['event_description'] = this.makeDescription(obj['event_image-src'], eventObj['event_title'], obj['event_text'], eventObj['event_link']);
		}

		var timeSeparator = false;
		if (this.checkKey(obj['event_date-time-separator'])) {
			timeSeparator = obj['event_date-time-separator'];
		}

		//temporary hack scraping facebook events insteat importing via api
		if (this.checkKey(obj['event_facebooktime'])) {
			var ttaa = obj['event_facebooktime'].split(' to ');
				arr = [this.formatJSDate(new Date(ttaa[0].replace(/ /g, "T")))];
			if (ttaa.length > 1) {
				arr.push(this.formatJSDate(new Date(ttaa[1].replace(/ /g, "T"))));
			} else {
				arr.push(arr[0]);
			}
		} else {
			// get both formatted dates, as usuall
			arr = this.processDate(obj['event_start'], obj['event_end'], timeSeparator);
		}
		// add event_start
		eventObj['event_start'] = arr[0];
		// add event_end
		eventObj['event_end'] = arr[1];
		//add event times to import object, even if they are undefined
		obj['event_start-time']  = arr[2];
		obj['event_end-time'] = arr[3];


		// add event_category
		eventObj['event_category'] = obj['event_category'];

		// DEPRECATED: add event_maplink (now beeing added as constant)
		//eventObj['event_maplink'] = obj['event_maplink'];

		// add event_organizer
		eventObj['event_organizer'] = obj['event_organizer'];

		// add event_venue
		eventObj['event_venue'] = obj['event_venue'];

		// add event_cost
		eventObj['event_cost'] = obj['event_cost'];

        // add constants
        eventObj['event_map'] = 1;
        eventObj['event_maplink'] = 1;
        eventObj['event_allday'] = (!(obj['event_start-time']) + 0);
        eventObj['event_start-time'] = obj['event_start-time'] || '';
        eventObj['event_end-time'] = obj['event_end-time'] || '';
        var tempdesc = this.makeDescription(obj['event_image-src'], eventObj['event_title'], obj['event_text']);
        tempdesc = tempdesc.replace(/\t/g, " ");
        eventObj['event_text'] = tempdesc.replace(/\n/g, "<br />") || '';
        eventObj['event_image'] = obj['event_image-src'] || '';

		// return the newly created object
		return eventObj;
	},
	processAll: function(JSONarray) { //tested
		// deduplicate JSONarray, format objects and pass them to a new JSON
		var len, obj;
		var eventArr = [];
		// deduplicate
		JSONarray = this.deduplicateByKey(JSONarray, 'event_id');

		len = JSONarray.length;
		for (var i = 0; i < len; i++) {
			// format object
			obj = this.formatEventObject(JSONarray[i]);
			// check if aggregator plugin format is on and if it is, reformat object
			if (aggregetorPluginFormat) {
				obj = this.reformatAggregetorPlugin(obj);
			}
			// add object to new array
			eventArr.push(obj);
		}
		return eventArr;
	},
	reformatAggregetorPlugin: function(obj) {
		// reformat event objects to format required by modern tribe event aggregator plugin (https://theeventscalendar.com/knowledgebase/csv-files-options-and-examples/)
		var mapping = {
			"EVENT NAME": "event_title",
			"VENUE NAME": "event_venue",
			"ORGANIZER NAME": "event_organizer",
			"START DATE": "event_start",
			"START TIME": "event_start-time",
			"END DATE": "event_end",
			"END TIME": "event_end-time",
			"ALL DAY EVENT?": "event_allday",
			"CATEGORIES": "event_category",
			"EVENT COST": "event_cost",
			"EVENT WEBSITE": "event_link",
			"SHOW MAP LINK?": "event_maplink",
			"SHOW MAP?": "event_map",
			"EVENT DESCRIPTION": "event_text",
			"EVENT IMAGE" : "event_image"
		}

		return jt(mapping, obj);
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

	
//options for converter
var options = {
	DELIMITER: {
		WRAP : '"'
	}
};

var files = fs.readdirSync(path+'json/');

function processFiles(fileNames) {
	var myfile, 
		jsn,
		filepath;
	for (var i=0; i < files.length; i++) {
		filepath = path + 'json/' + files[i];
		myfile = jf.readFileSync(filepath);
		jsn=helpers.processAll(myfile);
		//convertData(jsn, files[i]);
		writeData(jsn, files[i]);
	}

}

function writeData(JSON, name) {
	jf.writeFileSync(path+'processed/'+ name, JSON);
};


// function convertData(JSON, name) {
// 	// assign argument to closure variable
// 	var fname = name;
// 	var json2csvCallback = function (err, csv) {
// 	    if (err) throw err;
// 	    writeData(csv, fname);
// 	};
// 	csvconverter.json2csv(JSON, json2csvCallback, options);
// };


// function writeData(CSV, name) {
// 	fs.writeFileSync(path+'csv/'+ name+'.csv', CSV);
// };



 processFiles(files);  




};
