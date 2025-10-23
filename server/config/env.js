require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL,
};