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
		checkKey: function(key) { // tested
			// returns true if a key is defined and not empty
			if (((typeof key) !== "undefined") && (key !== '')) {
					return true;
			} else {
				return false;
			}
		},
		getValuesFromKey: function(key) { // tested
			// returns comma-separated string of values attached by "__" to a keyname
			var valuePair = [];
			var valArray = key.split('__');
			valuePair[0] = valArray.shift();
			if (valArray.length > 0) {
				valuePair[1] = valArray.join(', ');
			}
			return valuePair;
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
		extractDate: function(start_date, end_date) {
			/*

16.04.15 – 19.05.15			16.04.15 – 19.05.15
Del 6 de marzo al 7 de junio de 2015	Del 6 de marzo al 7 de junio de 2015
15 septiembre 2014- 22 febrero 2015	15 septiembre 2014- 22 febrero 2015
4.6.15					25.10.15
05/06					06/09/2015
27 febrero – 31 mayo 2015		27 febrero – 31 mayo 2015
Miércoles, 18 Febrero, 2015		Domingo, 22 Marzo, 2015
01 ene.					31 dic. 2014
24 sep. 2014				null
null					null
03.03 - 19.04.2015			03.03 - 19.04.2015


scraper specials:
-both dates the same: one day event
-both dates the same: both in same field
-null in one, date in other: one day event
-null in both: delete event (has not been scheduled yet)


double date:
-dash appears only once or at least 3 times
-letters are present and one dash appears (1-3 de marzo)
-letters are present and 2 months appear (del 1 de marzo al 3 de abril) -> split by "al", "hasta", "fins", "until", "to"

single dates, no letters:
-split by either ".", "/" or "-"
-if resulting array.length is 1 -> day, need to exract month and year from other date
-if resulting array.length is 2 -> day and month, need to exract year from other date
-if resulting array.length is 3 -> day, month and year, check length of year and fix to 4

single dates, with letters:
-find month, go back to nearest number -> day, go forward to nearest number -> year


			*/
		},
		switchToUSDate: function(date) {
			//swithces to USA date format
			date.toLocaleDateString('en-US');
		},
		formatLink: function(link, base) {
			// adds a base (url) to a (relative) link
			return base + link;
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
		addMissingColumns: function(cost, category, maplink, organizer, venue) {

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

var arr = ['apple', 'oranges', 'banana', 'kiwi', 'cherry']

	var file = 'json/04-05-2015/artbcn_events.json'
	//console.log(util.inspect(jf.readFileSync(file)))
	var myObj = jf.readFileSync(file);
	console.log(myObj[0].event_title1);
	//var test = myObj[0].event_title3;
	// console.log(helpers.cherrySplice(arr, [0,2,3]));
	// console.log(arr);
	console.log(helpers.deduplicateByKey(test5, "event_link-href"));
};

/**
 * Send User
 */
