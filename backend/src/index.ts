import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Configuration
const DATA_FILE = path.join(__dirname, 'plant-data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Initialize data files
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper functions
const getPlants = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const savePlants = (plants) => fs.writeFileSync(DATA_FILE, JSON.stringify(plants, null, 2));

// ======================
// API Endpoints
// ======================

// Get all plants
app.get('/get_plants', (_req, res) => {
  try {
    const plants = getPlants();
    res.json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: 'Failed to load plants' });
  }
});

// Get single plant
app.get('/get_plant/:id', (req, res) => {
  try {
    const plantId = parseInt(req.params.id);
    const plant = getPlants().find(p => p.id === plantId);
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ error: 'Failed to load plant' });
  }
});

// Add new plant
app.post('/add_plant', (req, res) => {
  try {
    const { id, name, schedule, species, location, account, picture } = req.body;
    
    // Save image
    const base64Data = picture.replace(/^data:image\/\w+;base64,/, '');
    const imagePath = path.join(UPLOADS_DIR, `plant_${id}.png`);
    fs.writeFileSync(imagePath, base64Data, { encoding: 'base64' });

    // Add to database
    const plants = getPlants();
    const newPlant = {
      id,
      name,
      schedule,
      species,
      location,
      account,
      picture: `/uploads/plant_${id}.png`,
      lastWatered: null, // Track watering manually
      createdAt: new Date().toISOString()
    };
    
    plants.push(newPlant);
    savePlants(plants);

    res.json({ success: true, plant: newPlant });
  } catch (error) {
    console.error('Error adding plant:', error);
    res.status(500).json({ error: 'Failed to add plant' });
  }
});

// Get reminders (simplified)
app.get('/get_reminders', (_req, res) => {
  try {
    const plants = getPlants();
    const reminders = plants.filter(plant => {
      // Simple reminder logic: plants not watered in 24 hours
      if (!plant.lastWatered) return true;
      const hoursSinceWatering = (Date.now() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60);
      return hoursSinceWatering > 24;
    });
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Water plant endpoint
app.post('/water_plant/:id', (req, res) => {
  try {
    const plantId = parseInt(req.params.id);
    const plants = getPlants();
    const plantIndex = plants.findIndex(p => p.id === plantId);
    
    if (plantIndex === -1) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    plants[plantIndex].lastWatered = new Date().toISOString();
    savePlants(plants);
    
    res.json({ success: true, plant: plants[plantIndex] });
  } catch (error) {
    console.error('Error watering plant:', error);
    res.status(500).json({ error: 'Failed to water plant' });
  }
});

// Get total plants count
app.get('/total_plants', (_req, res) => {
  res.json({ totalPlants: getPlants().length });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});