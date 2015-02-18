function cron() {
	
	var rawData = getData() {
		var data = [];
		var counter = 0;
		for site in sites {
			var j = loadJSON(site);
			data[counter] = scrape(site, j);
			counter++;
		}		
		return data:
	}

	var allData = cleanData(rawData) {
		rawData.map(combineTitle);
		rawData.map(generateImages);
		rawData.map(combineDescription);
		rawDate.map(sanitizeDate);
	}

	saveData(allData) {
		var newData = deduplicate(allData);
		saveToDB(newData);
	}

	cleanDB() {
		deleteOldEvents();
	}
}