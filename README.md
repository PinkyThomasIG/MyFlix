# myFlix Movie API

The myFlix Movie API serves as the backbone of the myFlix movie application, providing comprehensive data on movies, directors, and genres. Designed for movie enthusiasts and frontend developers, this API enables users to manage their profiles and curate their list of favorite films.

Built with the MERN stack (MongoDB, Express, React, Node.js), this RESTful API ensures seamless communication between the client and server, delivering a smooth and efficient user experience.

## Project Overview

### Objective

The myFlix Movie API delivers structured movie-related data while enabling users to:

- Register and manage their profiles
- Update their details
- Save favorite movies

It is built as a RESTful API, ensuring efficient and intuitive communication between the client and server.

### Features

Comprehensive Movie Data – Retrieve essential details such as movie titles, descriptions, genres, and more.  
User Management – Register, update profile information, and maintain a list of favorite movies.  
RESTful Architecture – Designed following best practices for efficient and scalable API interactions.

## Technology Stack

MongoDB – NoSQL database for storing movie and user data

- Express.js – Backend framework for handling API requests
- React.js – Frontend framework (for the client-side application)
- Node.js – JavaScript runtime environment

## Installation & Setup

To run this API locally, follow these steps:

### 1. Clone the repository

git clone https://github.com/your-username/myFlix-API.git
cd myFlix-API

### Install Dependencies

npm install

### Configure the environment

Create a .env file in the root directory and add your MongoDB connection string and other environment variables.

### Start the server

npm start

Test the API Open Postman or your API testing tool to verify the endpoints are working correctly.

## API Endpoints

| Method     | Endpoint                           | Description                        |
| ---------- | ---------------------------------- | ---------------------------------- |
| **GET**    | `/movies`                          | Get a list of all movies           |
| **GET**    | `/movies/:title`                   | Get details about a specific movie |
| **GET**    | `/genres/:name`                    | Get information about a genre      |
| **GET**    | `/directors/:name`                 | Get details about a director       |
| **POST**   | `/users`                           | Register a new user                |
| **PUT**    | `/users/:username`                 | Update user details                |
| **POST**   | `/users/:username/movies/:movieId` | Add a movie to a user's favorites  |
| **DELETE** | `/users/:username/movies/:movieId` | Remove a movie from favorites      |
| **DELETE** | `/users/:username`                 | Delete a user account              |
