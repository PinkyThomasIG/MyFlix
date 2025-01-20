// Import required modules
const http = require("http");
const fs = require("fs");
const url = require("url");

// Define the server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true); // Parse the incoming request URL
  const timestamp = new Date().toISOString(); // Generate timestamp

  // Log the request URL and timestamp to log.txt
  const logMessage = `${timestamp} - Requested URL: ${req.url}\n`;
  fs.appendFile("log.txt", logMessage, (err) => {
    if (err) console.error("Error logging request:", err);
  });

  // Route handling
  if (parsedUrl.pathname === "/documentation") {
    // Serve the documentation.html file
    fs.readFile("documentation.html", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else {
    // Serve the index.html file for any other route
    fs.readFile("index.html", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  }
});

// Start the server
server.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
