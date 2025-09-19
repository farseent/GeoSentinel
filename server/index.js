const connectDB = require('./config/database');
const { PORT } = require('./config/env');
const app = require('./app');

connectDB();

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
); 