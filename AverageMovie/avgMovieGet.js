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
		"budget": 0,
		"genres": [],
		"id": 0,
		"lang": "tmdbDeets.original_language",
		"ogTitle": "tmdbDeets.original_title",
		"relDate": "tmdbDeets.release_date",
		"relYear": 0,
		"rating" : "NR",
		"revenue": 0,
		"runtime": 0,
		"title": "tmdbDeets.title",
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

	full.budget = tmdbDeets.budget;
	full.genres = tmdbDeets.genres;
	full.id = oneL.id;
	full.lang = tmdbDeets.original_language;
	full.ogTitle = tmdbDeets.original_title;
	full.relDate = tmdbDeets.release_date;
	full.relYear = parseInt(tmdbDeets.release_date.split("-")[0]);
	full.revenue = tmdbDeets.revenue;
	full.runtime = tmdbDeets.runtime;
	full.title = tmdbDeets.title;

	full.rating = await getMovieRating(full.id);
	var cast = await getCast(full.id);
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
		"revBudg" : 0,
		"relYear" : 0,
		"numCast" : 0,
		"numGens" : 0
	}
	var counts = {
		"runtime" : 0,
		"revBudg" : 0,
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
		if ((movies[i].revenue > 0) && (movies[i].budget > 0)) {
			sums.revBudg += (movies[i].revenue / movies[i].budget);
			counts.revBudg += 1;
		}
		if (movies[i].relYear > 0) {
			sums.relYear += movies[i].relYear;
			counts.relYear += 1;
		}
		if (movies[i].numCast > 0) {
			sums.numCast += movies[i].numCast;
			counts.numCast += 1;
		}
		if (movies[i].genres.length > 0) {
			sums.numGens += movies[i].genres.length;
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

	console.log("counts.revBudg: " + counts.revBudg);

	var aves = {
		"runtime" : sums.runtime / counts.runtime,
		"revBudg" : sums.revBudg / counts.revBudg,
		"relYear" : sums.relYear / counts.relYear,
		"numCast" : sums.numCast / counts.numCast,
		"numGens" : sums.numGens / counts.numGens,
		"langs" : Array.from(catMap.lang),
		"ratings" : Array.from(catMap.rating),
		"genres" : Array.from(catMap.genres)
	}
	aves.langs.sort((a,b) => {
		return b[1] - a[1];
	});
	aves.ratings.sort((a,b) => {
		return b[1] - a[1];
	});
	aves.genres.sort((a,b) => {
		return b[1] - a[1];
	});

	//console.log(aves);

	return aves;
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
	var transformed = [];

	//transform
	for (var i = 0; i < rawData.length; i++) {
		idCheck.innerHTML = "Currently Checking: " + rawData[i].id;
		var movie = await transformOneline(rawData[i]);
		if (movie.id != -1) {
			transformed.push(movie);
		}
		numFound.innerHTML = "Number Found: " + transformed.length;
	}

	console.log(transformed);

	var averages = summarize(transformed);

	console.log(averages);

	let out = document.getElementById("output");
	out.innerHTML = JSON.stringify(averages);

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