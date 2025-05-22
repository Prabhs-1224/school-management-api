const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Test route
app.get('/', (req, res) => {
  res.send('School Management API is running.');
});

// Add School API
app.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validation
  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      console.error('Error adding school:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.status(201).json({ message: 'School added successfully', schoolId: result.insertId });
  });
});

// Function to calculate geographical distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = angle => angle * (Math.PI / 180);
  const R = 6371; // Earth radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// List Schools API
app.get('/listSchools', (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required as query parameters' });
  }

  db.query('SELECT * FROM schools', (err, results) => {
    if (err) {
      console.error('Error fetching schools:', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const schoolsWithDistance = results.map(school => {
      const distance = calculateDistance(userLat, userLon, parseFloat(school.latitude), parseFloat(school.longitude));
      return { ...school, distance: parseFloat(distance.toFixed(2)) };
    });

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(schoolsWithDistance);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
