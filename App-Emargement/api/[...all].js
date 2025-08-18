// Catch-all API route for Vercel to forward all /api/* requests
// to the existing Express application exported by server.js

import app from './server.js';

export default function handler(req, res) {
  return app(req, res);
}


