const express = require('express');
const path = require('path'); // Ensure path module is imported
const app = express();
const PORT = 5000;

// ... Your API/other configurations go here

// 🔴 THE CRITICAL FIX: Configure Express to serve static files (CSS, JS, etc.)
// It tells Express to serve files from the 'frontend' directory, which is
// alongside the 'server.js' file.
app.use(express.static(path.join(__dirname, 'frontend')));


// Example API route (for context)
app.get('/api/sort', (req, res) => {
    // Your sort logic here
    res.json({ message: "Sorting result" });
});

// Fallback route: Serves the index.html file for any non-API request,
// ensuring SPA routing works and the initial page loads.
app.get('*', (req, res) => {
    // NOTE: Assumes frontend is in a directory relative to server.js
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
});
