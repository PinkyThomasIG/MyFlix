const express = require("express");
const app = express();

// GET route for /movies
app.get("/movies", (req, res) => {
  //array containing top 10 movies
  const topMovies = [
    { title: "The Trial of the Chicago", year: 2020 },
    { title: "Avengers: Endgame", year: 2019 },
    { title: "Avengers: Infinity War", year: 2018 },
    { title: "Baby Driver", year: 2017 },
    { title: "La La Land", year: 2016 },
    { title: "Inside out", year: 2015 },
    { title: "What We Do in the Shadows", year: 2014 },
    { title: "The Wolf of Wall Street", year: 2013 },
    { title: "Looper", year: 2012 },
    { title: "The Raid: Redemption", year: 2011 },
  ];
  // respond with JSON data.
  res.json(topMovies);
});
