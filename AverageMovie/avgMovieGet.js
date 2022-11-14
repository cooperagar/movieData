//Average Movie functions

//Collect the movie to use
//Gather their info
//Validate that we want that one
	//Equivalent to "Is it out?" status: released
	//Also want "Is this not a video?" video: false
		//This doesn't seem accurate all the time, but such is life
	//May as well check it's not adult, since we're here.
//Save it


async function main() {
	//beans
	let numFound = document.getElementById("numFound");
	let idCheck = document.getElementById("idCheck");
	numFound.innerHTML = "Number Found: ";
	idCheck.innerHTML = "Currently Checking: ";

	var hpRate = await getMovieRating(775);
	console.log(hpRate);

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