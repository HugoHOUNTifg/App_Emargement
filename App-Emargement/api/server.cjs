/** Server (CommonJS) for Vercel Functions **/
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const PDFDocument = require('pdfkit');
const ejs = require('ejs');
const isServerless = process.env.VERCEL === '1' || process.env.AWS_REGION;
const chromium = isServerless ? require('@sparticuz/chromium') : null;
const puppeteer = isServerless ? require('puppeteer-core') : require('puppeteer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = require('./server.js');

module.exports = app;


