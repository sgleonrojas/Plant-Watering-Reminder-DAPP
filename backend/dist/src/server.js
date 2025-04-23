import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Helper function to load plants.json
function loadPlants() {
    const filePath = path.join(__dirname, '../plants.json');  
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Helper function to save plants.json
function savePlants(plants) {
    const filePath = path.join(__dirname, '../plants.json');  
    fs.writeFileSync(filePath, JSON.stringify(plants, null, 2), 'utf8');
}

// Default route (checking if server is running)
app.get('/', (_req, res) => {
    res.send('Backend is running!');
});

// Route: Add a plant
app.post('/add_plant', (req, res) => {
    try {
      const plantData = req.body; // Receive plant data
      let plants = loadPlants(); 
  
      plants.push(plantData);
      savePlants(plants); // Save it to plants.json 
  
      return res.status(200).json({ message: 'Plant added successfully' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
  
// Route: Get total number of plants
app.get('/total_plants', (_req, res) => {
    try {
        const plants = loadPlants();
        return res.status(200).json({ totalPlants: plants.length });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Route: Get reminders (plants that need watering soon)
app.get('/get_reminders', (_req, res) => {
    try {
        const plants = loadPlants();
        const currentTime = new Date();
        const reminders = [];

        plants.forEach(plant => {
            const [scheduledHour, scheduledMinute] = plant.age.split(':').map(Number);  // Assuming 'age' is the scheduled time in HH:MM

            const currentHour = currentTime.getHours();
            const currentMinute = currentTime.getMinutes();

            if (currentHour === scheduledHour && Math.abs(currentMinute - scheduledMinute) <= 5) {
                reminders.push(plant);
            }
        });

        return res.status(200).json(reminders);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
