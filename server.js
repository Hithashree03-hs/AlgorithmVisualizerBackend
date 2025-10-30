const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000; // Use Render's dynamic port

// ✅ Serve login page first — this MUST come BEFORE static middleware
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// ✅ Serve main app (visualizer) page
app.get('/ALGORITHMVISUALIZERBACKEND', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ✅ API example
app.get('/api/sort', (req, res) => {
  res.json({ message: "Sorting result" });
});

// ✅ Serve static files *after* routes*
app.use(express.static(path.join(__dirname, 'frontend')));

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
