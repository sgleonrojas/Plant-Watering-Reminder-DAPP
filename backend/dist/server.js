import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 5000;
// Enable CORS
app.use(cors());
// Parse JSON requests with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Helper function to load plants.json
function loadPlants() {
    try {
        const filePath = path.resolve(__dirname, '../../plants.json');
        console.log('Loading plants from:', filePath);
        if (!fs.existsSync(filePath)) {
            console.log('plants.json does not exist, creating new file');
            fs.writeFileSync(filePath, '[]', 'utf8');
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        try {
            const plants = JSON.parse(data);
            console.log(`Plants data loaded successfully. Found ${plants.length} plants.`);
            return plants;
        }
        catch (parseError) {
            console.error('Error parsing plants.json:', parseError);
            return [];
        }
    }
    catch (e) {
        console.error('Error loading plants:', e);
        return [];
    }
}
// Helper function to save plants.json
function savePlants(plants) {
    try {
        const filePath = path.resolve(__dirname, '../../plants.json');
        console.log('Saving plants to:', filePath);
        fs.writeFileSync(filePath, JSON.stringify(plants, null, 2), 'utf8');
        console.log(`Plants saved successfully. Total plants: ${plants.length}`);
    }
    catch (e) {
        console.error('Error saving plants:', e);
        throw new Error('Failed to save plants data');
    }
}
// Validate plant data
function validatePlantData(data) {
    const required = ['id', 'name', 'schedule', 'species', 'location', 'account', 'picture'];
    const missing = required.filter(field => typeof data[field] === 'undefined');
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    if (!data.picture.startsWith('data:image/')) {
        throw new Error('Invalid image format');
    }
}
// Default route (checking if server is running)
app.get('/', (_req, res) => {
    res.send('Backend is running!');
});
// Route: Add a plant
app.post('/add_plant', (req, res) => {
    try {
        console.log('Received add_plant request');
        const plantData = req.body;
        // Log plant data without the full image for debugging
        const logData = { ...plantData, picture: plantData.picture ? 'data:image...' : 'no image' };
        console.log('Plant data received:', logData);
        // Validate the plant data
        validatePlantData(plantData);
        let plants = loadPlants();
        plants.push(plantData);
        savePlants(plants);
        console.log('Plant added successfully');
        return res.status(200).json({ message: 'Plant added successfully' });
    }
    catch (e) {
        console.error('Error adding plant:', e.message);
        return res.status(400).json({ error: e.message });
    }
});
// Route: Get all plants
app.get('/get_plants', (_req, res) => {
    try {
        const plants = loadPlants();
        return res.status(200).json(plants);
    }
    catch (e) {
        console.error('Error getting plants:', e);
        return res.status(500).json({ error: e.message });
    }
});
// Route: Get total number of plants
app.get('/total_plants', (_req, res) => {
    try {
        const plants = loadPlants();
        return res.status(200).json({ totalPlants: plants.length });
    }
    catch (e) {
        console.error('Error getting total plants:', e);
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
            const [scheduledHour, scheduledMinute] = plant.schedule.split(':').map(Number);
            const currentHour = currentTime.getHours();
            const currentMinute = currentTime.getMinutes();
            if (currentHour === scheduledHour && Math.abs(currentMinute - scheduledMinute) <= 5) {
                reminders.push(plant);
            }
        });
        return res.status(200).json(reminders);
    }
    catch (e) {
        console.error('Error in get_reminders:', e);
        return res.status(500).json({ error: e.message });
    }
});
// Route: Get a single plant by ID
app.get('/get_plant/:id', (req, res) => {
    try {
        const plantId = parseInt(req.params.id);
        const plants = loadPlants();
        const plant = plants.find(p => p.id === plantId);
        if (!plant) {
            return res.status(404).json({ error: 'Plant not found' });
        }
        return res.status(200).json(plant);
    }
    catch (e) {
        console.error('Error getting plant:', e);
        return res.status(500).json({ error: e.message });
    }
});
// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    // Test file access on startup
    const testPath = path.resolve(__dirname, '../../plants.json');
    console.log('Testing file access...');
    console.log('plants.json location:', testPath);
    console.log('Directory exists:', fs.existsSync(path.dirname(testPath)));
    console.log('File exists:', fs.existsSync(testPath));
});
//# sourceMappingURL=server.js.map