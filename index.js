const dotenv = require("dotenv");

const { check, validationResult } = require("express-validator");

//const { check, validationResult } = require("express-validator");
const express = require("express"); // To handle HTTP requests and responses
const app = express();
dotenv.config();
const bodyParser = require("body-parser"); // middleware
app.use(bodyParser.json());
const cors = require("cors");
app.use(cors());
let auth = require("./auth")(app);
const passport = require("passport"); // For authentication
require("./passport");

const mongoose = require("mongoose");
const dbURI = process.env.MONGO_URI;

const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;

// Connect to MongoDB
mongoose
  .connect(dbURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// CREATE
// Add a new user

app.post(
  "/users",
  [
    check("Username", "Username is required").not().isEmpty(),
    check("Username", "Username must be at least 5 characters long").isLength({
      min: 5,
    }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed"
    ).isAlphanumeric(),
    check("Password", "password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + " already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Update user info by username
app.put(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Check if the authenticated user is the same as the user to be updated
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }

    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }
    )
      .then((updatedUser) => {
        if (updatedUser) {
          res.json(updatedUser);
        } else {
          res.status(404).send("No such user");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// ADD a movie to a user's list of favorites
app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Check if the authenticated user is the same as the user adding the favorite movie
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }
    // Add the movie to the favorites list only if it is not already there
    Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $addToSet: {
          // Use $addToSet to avoid duplicates
          FavoriteMovies: new mongoose.Types.ObjectId(req.params.MovieID),
        },
      },
      { new: true }
    )
      .then((updatedUser) => {
        if (updatedUser) {
          res.json(updatedUser);
        } else {
          res.status(404).send("User not found");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/* app.post(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Check if the authenticated user is the same as the user adding the favorite movie
      if (req.user.Username !== req.params.Username) {
        return res.status(403).send("Permission denied");
      }

      // Validate the MovieID format (should be a valid ObjectId format)
      if (!req.params.MovieID.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).send("Invalid MovieID format");
      }

      // Check if the movie exists in the Movies collection
      const movie = await Movies.findById(req.params.MovieID);
      if (!movie) {
        return res.status(404).send("Movie not found");
      }

      // Check if the movie is already in the user's favorite list
      const user = await Users.findOne({ Username: req.params.Username });
      if (user.FavoriteMovies.includes(req.params.MovieID)) {
        return res.status(400).send("Movie is already in your favorites");
      }

      // Update the user's favorite list by adding the movie ID
      const updatedUser = await Users.findOneAndUpdate(
        { Username: req.params.Username },
        { $addToSet: { FavoriteMovies: req.params.MovieID } }, // Prevent duplicates
        { new: true }
      ).lean();

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      res.json(updatedUser);
    } catch (err) {
      console.error("Error adding favorite movie:", err);
      res.status(500).send("Internal Server Error: " + err.message);
    }
  }
); */

// DELETE (Remove a movie from a user's favorite list)
app.delete(
  "/users/:Username/movies/:MovieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Check if the authenticated user is the same as the user deleting the favorite movie
      if (req.user.Username !== req.params.Username) {
        return res.status(403).send("Permission denied");
      }

      // Validate the MovieID format (should be a valid ObjectId format)
      if (!req.params.MovieID.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).send("Invalid MovieID format");
      }

      // Check if the movie exists in the Movies collection
      const movie = await Movies.findById(req.params.MovieID);
      if (!movie) {
        return res.status(404).send("Movie not found");
      }

      // Check if the movie is in the user's favorite list
      const user = await Users.findOne({ Username: req.params.Username });
      if (!user.FavoriteMovies.includes(req.params.MovieID)) {
        return res.status(400).send("Movie is not in your favorites");
      }

      // Remove the movie from the user's favorite list
      const updatedUser = await Users.findOneAndUpdate(
        { Username: req.params.Username },
        { $pull: { FavoriteMovies: req.params.MovieID } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      res.json(updatedUser);
    } catch (err) {
      console.error("Error removing favorite movie:", err);
      res.status(500).send("Internal Server Error: " + err.message);
    }
  }
);

// DELETE a user by username
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Check if the authenticated user is the same as the user being deleted
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }

    Users.findOneAndDelete({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(404).send(req.params.Username + " was not found");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// READ

// Get all movies

app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    console.log("Authenticated User:", req.user);
    try {
      const movies = await Movies.find();
      if (!movies.length) {
        return res.status(404).send("No movies found");
      }
      res.status(200).json(movies);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching movies");
    }
  }
);

// Get a user by username
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Check if the authenticated user is the same as the requested user
    if (req.user.Username !== req.params.Username) {
      return res.status(400).send("Permission denied");
    }

    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        if (user) {
          res.json(user);
        } else {
          res.status(404).send("User not found");
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

// Get a single movie by title
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Movies.findOne({ Title: req.params.title })
    Movies.findOne({
      Title: { $regex: new RegExp("^" + req.params.title + "$", "i") },
    })
      .then((movie) => {
        if (movie) {
          res.status(200).json(movie);
        } else {
          res.status(404).send("No such movie");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get genre data by name

app.get(
  "/movies/genre/:genreName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Use the correct genre name field in the query: "Genre.name"
    Movies.find({
      "genre.name": { $regex: new RegExp(req.params.genreName, "i") }, // Case-insensitive search
    })
      .then((movies) => {
        if (movies.length > 0) {
          res.status(200).json(movies);
        } else {
          res.status(404).send("No movies found for this genre");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// Get director data by name

app.get(
  "/movies/directors/:directorName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // Use the correct field names, matching the case in the database
    Movies.find({
      "director.name": { $regex: new RegExp(req.params.directorName, "i") },
    })
      .then((movies) => {
        if (movies.length > 0) {
          res.status(200).json(movies); // Return the movies where the director name matches
        } else {
          res.status(404).send("No movies found for this director");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// get all users

app.get(
  "/users",
  passport.authenticate("jwt", { session: false }), // Ensure the user is authenticated
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(200).json(users); // Return all users in the database
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send(
    "Welcome to MyFlix API! Use Postman or a frontend to interact with the API."
  );
});

app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
