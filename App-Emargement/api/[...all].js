// Catch-all API route for Vercel to forward all /api/* requests
// to the existing Express application exported by server.js

const app = require('./server');

module.exports = (req, res) => app(req, res);


