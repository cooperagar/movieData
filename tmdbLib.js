//A library of TMDb API calls to use for other purposes.

const genreURL = "https://api.themoviedb.org/3/genre/movie/list?api_key=<<api_key>>&language=en-US".replace("<<api_key>>", config.apiKey);
const popularURL = "https://api.themoviedb.org/3/movie/popular?api_key=<<api_key>>&language=en-US&page=1".replace("<<api_key>>", config.apiKey);
const movieDetailsURL = "https://api.themoviedb.org/3/movie/{movie_id}?api_key=<<api_key>>&language=en-US".replace("<<api_key>>", config.apiKey);
const movieCreditsURL = "https://api.themoviedb.org/3/movie/{movie_id}/credits?api_key=<<api_key>>&language=en-US".replace("<<api_key>>", config.apiKey);
const movieReleaseURL = "https://api.themoviedb.org/3/movie/{movie_id}/release_dates?api_key=<<api_key>>".replace("<<api_key>>", config.apiKey);

//Queries TMDb and returns an array of all possible genres.
async function getGenreList() {
	let genreResponse = await fetch(genreURL);
	let genreData = await genreResponse.json();
	return genreData.genres;
}

//Given a genre ID, it finds the name of that genre, if it exists
//This queries the API each time it's called, so this could be optimized
//if searching for multiple genres.
//ARGS: searchID - the ID to look up
async function getGenreByID(searchID) {
	let genres = await getGenreList();
	genreName = "Genre not found";
	for (j in genres) {
		if (genres[j].id == searchID) {
			genreName = genres[j].name;
			break;
		}
	}
	console.log(genreName);
	return genreName;
}

//Queries TMDb and returns an array of most popular movies.
//Note: this returns the abbreviated details for the movies.
async function getPopularList() {
	let response = await fetch(popularURL);
	let data = await response.json();
	return data.results;
}

//Queries TMDb and returns a single movie object.
//ARGS: searchID - the movie ID to return
async function getMovieDetails(searchID) {
	requestURL = movieDetailsURL.replace("{movie_id}",searchID);
	let response = await fetch(requestURL);
	let data = await response.json();
	return data;
}

//Queries TMDb to find the primary release of a film.
//ARGS: movieID - the movie to look up
//		ctry - the country code to use, defaults to 'US'
async function getPrimaryRelease(movieID, ctry='US') {
	requestURL = movieReleaseURL.replace("{movie_id}",movieID);
	let response = await fetch(requestURL);
	let data = await response.json();
	var relGrp = data.results.filter(d => (d.iso_3166_1 == ctry));
	if (relGrp.length > 1) {
		console.log("Error: multiple release groups for country");
		return "Error";
	}
	if (relGrp.length < 1) {
		console.log("Error: no release groups for country");
		return "Error";
	}
	var releases = relGrp[0].release_dates;
	releases.sort((a, b) => {
		var pri = [2, 3];
		var sec = [1];
		if (pri.includes(a.type) && !pri.includes(b.type)) {		//a is a primary type, b is not
				return -1;											//a comes before b
		}
		if (pri.includes(b.type) && !pri.includes(a.type)) {		//b is a primary type, a is not
			return 1;												//a comes after b
		}
		
		//at this point, either both a pri, or neither are pri
		if (sec.includes(a.type) && !sec.includes(b.type)) {		//a is a premiere, b is lower
			return -1;												//a comes before b
		}
		if (sec.includes(b.type) && !sec.includes(a.type)) {		//b is a premiere, a is lower
			return 1;												//a comes after b
		}
		
		//at this point, they are in the same category, so sort by date
		if (a.release_date < b.release_date) {						//a is lower (earlier)
			return -1;												//a comes before b
		}
		if (a.release_date > b.release_date) {						//b is lower (earlier)
			return 1;												//a comes after b
		}

		//now, in the very unlikely event they're still the same
		if (a.certification != "") {								//a has a rating
			return -1;												//a comes before b
		}

		return 1;													//default, a comes after b
	});

	//console.log(releases);
	return releases[0];
}

//Queries TMDb and returns the MPA(A) rating of the movie.
//ARGS: movieID - the movie to look up
async function getMovieRating(movieID) {
	var primRel = await getPrimaryRelease(movieID);
	var rating = "NR";
	if (primRel === "Error") {
		return rating;
	}
	if (primRel.certification != "") {
		rating = primRel.certification;
	}
	return rating;
}

//Queries TMDb and returns the cast and crew for a movie.
//ARGS: movieID - the movie whose credits to return
async function getMovieCredits(movieID) {
	requestURL = movieCreditsURL.replace("{movie_id}",movieID);
	let response = await fetch(requestURL);
	let data = await response.json();
	return data;
}

//Queries TMDb and returns the cast a movie.
//ARGS: movieID - the movie whose credits to return
async function getCast(movieID) {
	let movie = await getMovieCredits(movieID);
	return movie.cast;
}

//Queries TMDb and returns the crew a movie.
//ARGS: movieID - the movie whose credits to return
async function getCrew(movieID) {
	let movie = await getMovieCredits(movieID);
	return movie.crew;
}

//Queries TMDb and returns the director(s) for a movie.
//Note: this returns the abbreviated details of the director(s).
//ARGS: movieID - the movie whose director to return
async function getDirector(movieID) {
	let crew = await getCrew(movieID);
	directorArr = [];
	for (const i in crew) {
		if (crew[i].job == "Director") {
			directorArr.push(crew[i]);
		}
	}
	return directorArr;
}

//Queries TMDb and returns the above the line people
//Writers, Directors, Producers, Top X Cast
//ARGS: movieID - the movie whose credits to return
//		numCast - How many of the top cast do you want
//					optional; default is 5
async function getAboveTheLine(movieID, numCast = 5) {
	requestURL = movieCreditsURL.replace("{movie_id}",movieID);
	let response = await fetch(requestURL);
	let data = await response.json();

	atl = {
		"directors": [],
		"writers": [],
		"producers": [],
		"topCast": []
	}
	for (var i in data.crew) {
		if (data.crew[i].job == "Director") {
			atl.directors.push(data.crew[i]);
		}
		else if (data.crew[i].job == "Screenplay") {
			atl.writers.push(data.crew[i]);
		}
		else if (data.crew[i].job == "Producer") {
			atl.producers.push(data.crew[i]);
		}
	}
	for (var j = 0; j < numCast; j++) {
		atl.topCast.push(data.cast[j]);
	}

	return atl;
}

//General proof of concept function
async function test() {
	// let cast = await getDirector(100402);
	// console.log(cast);
}