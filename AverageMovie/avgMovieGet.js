//Average Movie functions

//Collect the movie to use
//Gather their info
//Validate that we want that one
	//Equivalent to "Is it out?" status: released
	//Also want "Is this not a video?" video: false
		//This doesn't seem accurate all the time, but such is life
	//May as well check it's not adult, since we're here.
	//Do we want to include shorts?
//Save it

//Load the data
async function extractList() {
	file = "./movie_ids_test.json";
	let listResponse = await fetch(file);
	let listData = await listResponse.json();
	console.log(listData);
	return listData;
}

//Transform from one-line description to all data
//Returns the full movie object. 
//If this oneL is invalid, full.id will be set to -1
//ARGS: oneL - the one-line movie object from the list
async function transformOneline(oneL) {
	var full = {
		"genres": [],
		"id": 0,
		"lang": "tmdbDeets.original_language",
		"ogTitle": "tmdbDeets.original_title",
		"relDate": "tmdbDeets.release_date",
		"relYear": 0,
		"rating" : "NR",
		"revBudg": 0,
		"runtime": 0,
		"title": "tmdbDeets.title",
		"numGens": 0,
		"numCast": []												//This might technically be a bug :|
	};
	if ((oneL.adult == true) || (oneL.video == true)) {				//skip adult movies and videos
		full.id = -1;
		return full;
	}
	var tmdbDeets = await getMovieDetails(oneL.id);
	if (tmdbDeets.runtime < 40) {									//skip shorts
		full.id = -1;
		return full;
	}

	full.genres = tmdbDeets.genres;
	full.id = oneL.id;
	full.lang = tmdbDeets.original_language;
	full.ogTitle = tmdbDeets.original_title;
	full.relDate = tmdbDeets.release_date;
	full.relYear = parseInt(tmdbDeets.release_date.split("-")[0]);
	full.runtime = tmdbDeets.runtime;
	full.title = tmdbDeets.title;

	if ((tmdbDeets.revenue > 0) && (tmdbDeets.budget > 0)) {
		full.revBudg = tmdbDeets.revenue / tmdbDeets.budget;
	}

	full.rating = await getMovieRating(full.id);
	var cast = await getCast(full.id);
	full.numGens = full.genres.length;
	full.numCast = cast.length;

	return full;
}

//Summarize the movies to create the average metrics
//Finds the mean for numerical data
//Ranks the category data
//ARGS: movies - the list to summarize
function summarize(movies) {
	var sums = {
		"runtime" : 0,
		//"revBudg" : 0,
		"relYear" : 0,
		"numCast" : 0,
		"numGens" : 0
	}
	var counts = {
		"runtime" : 0,
		//"revBudg" : 0,
		"relYear" : 0,
		"numCast" : 0,
		"numGens" : 0
	}
	var catMap = {
		"lang" : new Map(),
		"genres" : new Map(),
		"rating" : new Map()
	}

	for (var i = 0; i < movies.length; i++) {
		console.log("Summarizing");
		//sum & counts
		if (movies[i].runtime > 0) {
			sums.runtime += movies[i].runtime;
			counts.runtime += 1;
		}
		// if (movies[i].revBudg > 0) {
		// 	sums.revBudg += movies[i].revBudg;
		// 	counts.revBudg += 1;
		// }
		if (movies[i].relYear > 0) {
			sums.relYear += movies[i].relYear;
			counts.relYear += 1;
		}
		if (movies[i].numCast > 0) {
			sums.numCast += movies[i].numCast;
			counts.numCast += 1;
		}
		if (movies[i].numGens > 0) {
			sums.numGens += movies[i].numGens;
			counts.numGens += 1;
		}
		//map
		if (!catMap.lang.has(movies[i].lang)) {
			catMap.lang.set(movies[i].lang, 0);
		}
		var curr = catMap.lang.get(movies[i].lang);
		catMap.lang.set(movies[i].lang, curr + 1);
		if (!catMap.rating.has(movies[i].rating)) {
			catMap.rating.set(movies[i].rating, 0);
		}
		curr = catMap.rating.get(movies[i].rating);
		catMap.rating.set(movies[i].rating, curr + 1);
		for (var g = 0; g < movies[i].genres.length; g++) {
			if (!catMap.genres.has(movies[i].genres[g].id)) {
				catMap.genres.set(movies[i].genres[g].id, 0);
			}
			curr = catMap.genres.get(movies[i].genres[g].id);
			catMap.genres.set(movies[i].genres[g].id, curr + 1)
		}
	}

	console.log(counts);

	var aves = {
		"runtime" : sums.runtime / counts.runtime,
		//"revBudg" : sums.revBudg / counts.revBudg,
		"relYear" : sums.relYear / counts.relYear,
		"numCast" : sums.numCast / counts.numCast,
		"numGens" : sums.numGens / counts.numGens,
		"lang" : Array.from(catMap.lang),
		"rating" : Array.from(catMap.rating),
		"genres" : Array.from(catMap.genres)
	}
	aves.lang.sort((a,b) => {
		return b[1] - a[1];
	});
	aves.rating.sort((a,b) => {
		return b[1] - a[1];
	});
	aves.genres.sort((a,b) => {
		return b[1] - a[1];
	});

	//console.log(aves);

	return aves;
}

//Find the standard deviations of the numerical metrics
//ARGS: movies - the list of raw data
//		aves - the arithmetic means of the metrics
function calcDevs(movies, aves) {
	var sums = {
		"runtime" : 0,
		//"revBudg" : 0,
		"relYear" : 0,
		"numCast" : 0,
		"numGens" : 0
	}
	var counts = {
		"runtime" : 0,
		//"revBudg" : 0,
		"relYear" : 0,
		"numCast" : 0,
		"numGens" : 0
	}

	for (var i = 0; i < movies.length; i++) {
		console.log("Deviating");
		//sum & counts
		if (movies[i].runtime > 0) {
			sums.runtime += (movies[i].runtime - aves.runtime)**2;
			counts.runtime += 1;
		}
		// if (movies[i].revBudg > 0) {
		// 	sums.revBudg += (movies[i].revBudg - aves.revBudg)**2;
		// 	counts.revBudg += 1;
		// }
		if (movies[i].relYear > 0) {
			sums.relYear += (movies[i].relYear - aves.relYear)**2;
			counts.relYear += 1;
		}
		if (movies[i].numCast > 0) {
			sums.numCast += (movies[i].numCast - aves.numCast)**2;
			counts.numCast += 1;
		}
		if (movies[i].numGens > 0) {
			sums.numGens += (movies[i].numGens - aves.numGens)**2;
			counts.numGens += 1;
		}
	}

	var devs = {
		"runtime" : Math.sqrt(sums.runtime / counts.runtime),
		"revBudg" : Math.sqrt(sums.revBudg / counts.revBudg),
		"relYear" : Math.sqrt(sums.relYear / counts.relYear),
		"numCast" : Math.sqrt(sums.numCast / counts.numCast),
		"numGens" : Math.sqrt(sums.numGens / counts.numGens)
	}
	return devs;
}

async function main() {
	//beans
	let numFound = document.getElementById("numFound");
	let idCheck = document.getElementById("idCheck");
	numFound.innerHTML = "Number Found: ";
	idCheck.innerHTML = "Currently Checking: ";

	// var hpRate = await getMovieRating(775);
	// console.log(hpRate);

	var rawData = await extractList();

	var out = {
		"trans" : [],
		"aves" : {},
		"devs" : {}
	}

	//transform
	for (var i = 0; i < rawData.length; i++) {
		idCheck.innerHTML = "Currently Checking: " + rawData[i].id;
		var movie = await transformOneline(rawData[i]);
		if (movie.id != -1) {
			out.trans.push(movie);
		}
		numFound.innerHTML = "Number Found: " + out.trans.length;
	}
	console.log(out.trans);

	out.aves = summarize(out.trans);
	console.log(out.aves);

	out.devs = calcDevs(out.trans, out.aves);
	console.log(out.devs);

	let print = document.getElementById("output");
	print.innerHTML = JSON.stringify(out.aves);

	// var test = {"foo":3,
	// 			"bar":4,
	// 			add() {return (this.foo + this.bar)}};
	// console.log("foo: " + test.foo);
	// console.log("bar: " + test.bar);
	// console.log("add: " + test.add());
	// console.log(test);

	//loop through possible ids
	/*
	There's so much data in here.
	If I pull more than I need, I could crash a browser, and that's 
	definitely a no bueno thing to do.
	So what do I actually want from this?
	-Language
	-Runtime
	-Financials
		-Revenue/Budget
		-Revenue/Runtime
		-Budget/Runtime
		-Budget
		-Revenue
	-ReleaseDate
	-Genres
	-ProdCos?
	-Rating?
	-Actor demographics or number of characters?
		-This demographic stuff is interesting, but probably 
			not many surprises
	For the actual "average" calculation:
	-Language
	-Runtime
	-Financials
		-Revenue
		-Budget
	-ReleaseDate
	-Genres
	-Number of Characters
	-Rating?
	*/
}

main();