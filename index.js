const dotenv = require("dotenv");

const { check, validationResult } = require("express-validator");

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

/**
 * Create a new user.
 *
 * This endpoint allows a new user to register by providing a username, password, email, and birthday.
 * The password will be hashed before storing in the database.
 *
 * @function createUser
 * @param {Object} req.body - The body of the request.
 * @param {string} req.body.Username - The username of the new user.
 * @param {string} req.body.Password - The password for the new user.
 * @param {string} req.body.Email - The email address of the new user.
 * @param {string} req.body.Birthday - The birthdate of the new user.
 *
 * @returns {Object} A newly created user object.
 * @throws {400} If the user already exists.
 * @throws {422} If validation errors are found.
 * @throws {500} If there is a server error.
 *
 * @example
 * // Example request:
 * POST /users
 * {
 *   "Username": "john_doe",
 *   "Password": "password123",
 *   "Email": "john@example.com",
 *   "Birthday": "1990-01-01"
 * }
 *
 * // Example response:
 * {
 *   "Username": "john_doe",
 *   "Email": "john@example.com",
 *   "Birthday": "1990-01-01",
 *   "id": "5f5f5f5f5f5f5f5f5f5f5f5"
 * }
 */

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

/**
 * Update user information.
 *
 * This endpoint allows an authenticated user to update their username, password, email, and birthday.
 * Only the user who owns the account can update their information.
 *
 * @function updateUser
 * @param {string} req.params.Username - The username of the user to be updated.
 * @param {Object} req.body - The new user data.
 * @param {string} req.body.Username - The new username.
 * @param {string} req.body.Password - The new password.
 * @param {string} req.body.Email - The new email address.
 * @param {string} req.body.Birthday - The new birthday.
 *
 * @returns {Object} The updated user object.
 * @throws {400} If the user is not authorized to update this account.
 * @throws {404} If the user is not found.
 * @throws {500} If there is a server error.
 *
 * @example
 * // Example request:
 * PUT /users/john_doe
 * {
 *   "Username": "john_doe_updated",
 *   "Password": "newpassword123",
 *   "Email": "newemail@example.com",
 *   "Birthday": "1990-01-01"
 * }
 *
 * // Example response:
 * {
 *   "Username": "john_doe_updated",
 *   "Email": "newemail@example.com",
 *   "Birthday": "1990-01-01",
 *   "id": "5f5f5f5f5f5f5f5f5f5f5f5"
 * }
 */

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

/**
 * Add a movie to the user's favorite list.
 *
 * This endpoint allows an authenticated user to add a movie to their favorites list.
 * The movie will be added only if it is not already in the user's favorites.
 *
 * @function addMovieToFavorites
 * @param {string} req.params.Username - The username of the user adding the movie.
 * @param {string} req.params.MovieID - The movie ID to be added to the user's favorites list.
 *
 * @returns {Object} The updated user object with the favorite movie added.
 * @throws {400} If the user is not authorized to add a movie to this account.
 * @throws {404} If the user is not found.
 * @throws {500} If there is a server error.
 *
 * @example
 * // Example request:
 * POST /users/john_doe/movies/1234567890abcdef
 *
 * // Example response:
 * {
 *   "Username": "john_doe",
 *   "FavoriteMovies": [
 *     "1234567890abcdef"
 *   ]
 * }
 */

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

/**
 * Remove a movie from the user's favorite list.
 *
 * This endpoint allows an authenticated user to remove a movie from their favorites list.
 * If the movie is not in the user's favorites, an error will be returned.
 *
 * @function removeMovieFromFavorites
 * @param {string} req.params.Username - The username of the user removing the movie.
 * @param {string} req.params.MovieID - The movie ID to be removed from the user's favorites list.
 *
 * @returns {Object} The updated user object with the movie removed.
 * @throws {400} If the user is not authorized to remove a movie from this account.
 * @throws {404} If the user or movie is not found.
 * @throws {500} If there is a server error.
 *
 * @example
 * // Example request:
 * DELETE /users/john_doe/movies/1234567890abcdef
 *
 * // Example response:
 * {
 *   "Username": "john_doe",
 *   "FavoriteMovies": []
 * }
 */

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

/**
 * Get all movies in the database.
 *
 * This endpoint returns a list of all movies available in the database.
 *
 * @function getAllMovies
 *
 * @returns {Array} An array of movie objects.
 * @throws {404} If no movies are found.
 * @throws {500} If there is a server error.
 *
 * @example
 * // Example request:
 * GET /movies
 *
 * // Example response:
 * [
 *   {
 *     "id": "1",
 *     "Title": "Inception",
 *     "Genre": "Sci-Fi",
 *     "Director": "Christopher Nolan",
 *     "Year": 2010
 *   },
 *   {
 *     "id": "2",
 *     "Title": "The Dark Knight",
 *     "Genre": "Action",
 *     "Director": "Christopher Nolan",
 *     "Year": 2008
 *   }
 * ]
 */

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

/**
 * Get a user by their username.
 *
 * This endpoint retrieves a user by their username. The username is passed as a parameter in the URL.
 * The user must be authenticated with a JWT token, and the token must match the username requested.
 *
 * @function getUserByUsername
 * @param {string} Username - The username of the user to be retrieved.
 * @middleware passport.authenticate("jwt", { session: false }) - Ensures the user is authenticated using JWT.
 * @throws {400} If the authenticated user does not match the requested username.
 * @returns {Object} A user object with the details of the requested user.
 * @throws {404} If no user is found with the specified username.
 * @throws {500} If there is a server error while retrieving the user.
 *
 * @example
 * // Example request:
 * GET /users/johndoe
 *
 * // Example response:
 * {
 *   "Username": "johndoe",
 *   "Email": "johndoe@example.com",
 *   "Birthday": "1990-05-12",
 *   "id": "5f5f5f5f5f5f5f5f5f5f5f5"
 * }
 */

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

/**
 * Get a movie by its title.
 *
 * This endpoint retrieves a single movie by its exact title. The title is passed as a parameter in the URL.
 * The user must be authenticated with a JWT token to access this endpoint.
 *
 * @function getMovieByTitle
 * @param {string} title - The title of the movie to be retrieved.
 * @middleware passport.authenticate("jwt", { session: false }) - Ensures the user is authenticated using JWT.
 *
 * @returns {Object} A movie object with details about the specified movie.
 * @throws {404} If no movie is found with the specified title.
 * @throws {500} If there is a server error while retrieving the movie.
 *
 * @example
 * // Example request:
 * GET /movies/Inception
 *
 * // Example response:
 * {
 *   "Title": "Inception",
 *   "Director": "Christopher Nolan",
 *   "Genre": "Action, Adventure, Sci-Fi",
 *   "Year": "2010",
 *   "id": "5f5f5f5f5f5f5f5f5f5f5f5"
 * }
 */

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

/**
 * Get movies of a specific genre.
 *
 * This endpoint retrieves all movies that belong to a specified genre. The genre's name is passed as a parameter in the URL.
 * The user must be authenticated with a JWT token to access this endpoint.
 *
 * @function getMoviesByGenre
 * @param {string} genreName - The name of the genre whose movies are being requested.
 * @middleware passport.authenticate("jwt", { session: false }) - Ensures the user is authenticated using JWT.
 *
 * @returns {Array} An array of movie objects belonging to the specified genre.
 * @throws {404} If no movies are found for the specified genre.
 * @throws {500} If there is a server error while retrieving the movies.
 *
 * @example
 * // Example request:
 * GET /movies/genre/Action
 *
 * // Example response:
 * [
 *   {
 *     "Title": "Mad Max: Fury Road",
 *     "Director": "George Miller",
 *     "Genre": "Action, Adventure",
 *     "Year": "2015",
 *     "id": "5f5f5f5f5f5f5f5f5f5f5f5"
 *   },
 *   {
 *     "Title": "Die Hard",
 *     "Director": "John McTiernan",
 *     "Genre": "Action, Thriller",
 *     "Year": "1988",
 *     "id": "5f5f5f5f5f5f5f5f5f5f5f6"
 *   }
 * ]
 */

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

/**
 * Get movies directed by a specific director.
 *
 * This endpoint retrieves all movies directed by a specific director. The director's name is passed as a parameter in the URL.
 * The user must be authenticated with a JWT token to access this endpoint.
 *
 * @function getMoviesByDirector
 * @param {string} directorName - The name of the director whose movies are being requested.
 * @middleware passport.authenticate("jwt", { session: false }) - Ensures the user is authenticated using JWT.
 *
 * @returns {Array} An array of movie objects directed by the specified director.
 * @throws {404} If no movies are found for the specified director.
 * @throws {500} If there is a server error while retrieving the movies.
 *
 * @example
 * // Example request:
 * GET /movies/directors/Steven%20Spielberg
 *
 * // Example response:
 * [
 *   {
 *     "Title": "Jurassic Park",
 *     "Director": "Steven Spielberg",
 *     "Genre": "Adventure, Sci-Fi",
 *     "Year": "1993",
 *     "id": "5f5f5f5f5f5f5f5f5f5f5f5"
 *   },
 *   {
 *     "Title": "E.T. the Extra-Terrestrial",
 *     "Director": "Steven Spielberg",
 *     "Genre": "Family, Sci-Fi",
 *     "Year": "1982",
 *     "id": "5f5f5f5f5f5f5f5f5f5f5f6"
 *   }
 * ]
 */

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

/**
 * Get all users.
 *
 * This endpoint retrieves a list of all users from the database.
 * The user must be authenticated with a JWT token to access this endpoint.
 *
 * @function getAllUsers
 * @middleware passport.authenticate("jwt", { session: false }) - Ensures the user is authenticated using JWT.
 *
 * @returns {Array} An array of user objects. Each object contains the user's details.
 * @throws {500} If there is a server error while retrieving users.
 *
 * @example
 * // Example request:
 * GET /users
 *
 * // Example response:
 * [
 *   {
 *     "Username": "john_doe",
 *     "Email": "john_doe@example.com",
 *     "Birthday": "1990-01-01",
 *     "id": "5f5f5f5f5f5f5f5f5f5f5f5"
 *   },
 *   {
 *     "Username": "jane_doe",
 *     "Email": "jane_doe@example.com",
 *     "Birthday": "1992-02-02",
 *     "id": "5f5f5f5f5f5f5f5f5f5f5f6"
 *   }
 * ]
 */

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
