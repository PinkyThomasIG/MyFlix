const express = require("express"),
  morgan = require("morgan"),
  fs = require("fs"),
  bodyParser = require("body-parser"),
  uuid = require("uuid");
path = require("path");
const { title } = require("process");

const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});

let users = [
  {
    id: 1,
    name: "Peter",
    favoriteMovies: [],
  },
  {
    id: 2,
    name: "Herrman",
    favoriteMovies: ["Avengers: End game"],
  },
];

let movies = [
  {
    Title: "The Godfather",
    Description:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    Genre: {
      Name: "Crime",
    },
    Director: {
      Name: "Francis Ford Coppola",
    },
    ImageURL:
      "https://www.imdb.com/title/tt0068646/mediaviewer/rm1597694977/?ref_=tt_ov_i",
  },
  {
    Title: "The Matrix",
    Description:
      "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.",
    Genre: {
      Name: "Action/Sci-fi",
    },
    Director: {
      Name: "Lana Wachowski",
    },
    ImageURL:
      "https://www.imdb.com/title/tt0133093/mediaviewer/rm525547776/?ref_=tt_ov_i",
  },
  {
    Title: "The Lord of the Rings: The Return of the King",
    Description:
      "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring",
    Genre: {
      Name: "Fantasy",
    },
    Director: {
      Name: "Peter Jackson",
    },
    ImageURL:
      "https://www.imdb.com/title/tt0120737/mediaviewer/rm3592958976/?ref_=tt_ov_i",
  },
];
app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.static("pubblic/documentation.html"));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Weolcome to My Flix app!");
});

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

// Create new User
app.post("/users", (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send("Users Need Names");
  }
});

// Allow user to Update User Info
app.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send("No Such User");
  }
});

// Allow users to add movies to their list (only return a movie has been added)
app.post("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
  } else {
    res.status(400).send("No Such User");
  }
});

// Allow users to remove a movie from their favorites
app.delete("/users/:id/:movieTitle", (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(
      (title) => title !== movieTitle
    );
    res
      .status(200)
      .send(`${movieTitle} has been removed from user ${id}'s array`);
  } else {
    res.status(400).send("No Such User");
  }
});

// Allow a user to deregister
app.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    users = users.filter((user) => user.id != id);
    res.status(200).send(`user ${id} has been deleted.`);
  } else {
    res.status(400).send("No Such User");
  }
});

// Read
app.get("/movies", (req, res) => {
  res.status(200).json(movies);
});

// Read
app.get("/movies/:title", (req, res) => {
  const { title } = req.params;
  const movie = movies.find((movie) => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send("No Such Movie");
  }
});

// Read
app.get("/movies/genre/:genreName", (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find((movie) => movie.Genre.Name === genreName).Genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send("No Such Genre");
  }
});

// Read
app.get("/movies/director/:directorName", (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(
    (movie) => movie.Director.Name === directorName
  ).Director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send("No Such Director");
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});
