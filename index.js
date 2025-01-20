// import required modules

const express = require("express");
const morgan = require("morgan");
const app = express();
const port = 8080; // defining the port where the app will run on

// using Morgan  middleware for logging

app.use(morgan("common"));

// serve static files from 'public'

app.use(express.static("public"));

//GET route for the default endpoint

app.get("/", (req, res) => {
  res.send("Welcome to MyFlix API!");
});

// GET route for /movies to return top 10 movies

app.get("/movies", (req, res) => {
  const topMovies = [
    { title: "The Trial of Chicago", year: 2020 },
    { title: "Avengers: End Game", year: 2019 },
    { title: "Avengers: Infinity War", year: 2018 },
    { title: "Baby Driver", year: 2017 },
    { title: "La La Land", year: 2016 },
    { title: "Inside Out", year: 2015 },
    { title: "What We Do in the Shadows", year: 2014 },
    { title: "The Wolf of the Wall Street", year: 2013 },
    { title: "Looper", year: 2012 },
    { title: "The Raid: redemption", year: 2012 },
  ];
  res.json(topMovies);
});

// Error-handling middleware for logging errors

app.use((err, req, res, next) => {
  console.error(`Error: ${err.stack}`); // log the error to the terminal
  res.status(500).send("Something went wrong");
});

//start the server

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
