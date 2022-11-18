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
		"rating" : "NR",
		"revenue": 0,
		"runtime": 0,
		"title": "tmdbDeets.title",
		"numCast": []
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
	full.revenue = tmdbDeets.revenue;
	full.runtime = tmdbDeets.runtime;
	full.title = tmdbDeets.title;

	full.rating = await getMovieRating(full.id);
	var cast = await getCast(full.id);
	full.numCast = cast.length;

	return full;
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

	console.log(rawData[379].id);

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