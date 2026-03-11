const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const propertyRoutes = require('./routes/propertyRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('LandChain API running');
});

app.use('/api/property', propertyRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT);
