import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port: number = parseInt(process.env.PORT || '5000', 10);

// Enable CORS
app.use(cors());

// Parse JSON requests with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Define Plant type
interface Plant {
  id: number;
  name: string;
  schedule: string;
  species: string;
  location: string;
  account: string;
  picture: string;
}

// Helper function to load plants.json
function loadPlants(): Plant[] {
  try {
    const filePath = path.resolve(__dirname, '../../plants.json');
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as Plant[];
  } catch (e) {
    console.error('Error loading plants:', e);
    return [];
  }
}

// Helper function to save plants.json
function savePlants(plants: Plant[]): void {
  try {
    const filePath = path.resolve(__dirname, '../../plants.json');
    fs.writeFileSync(filePath, JSON.stringify(plants, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving plants:', e);
    throw new Error('Failed to save plants data');
  }
}

// Default route
app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running!');
});

// Route: Add a plant
app.post('/add_plant', (req: Request, res: Response) => {
    try {
      const plantData: Plant = req.body;
      const plants = loadPlants();
      plants.push(plantData);
      savePlants(plants);
      res.status(200).json({ message: 'Plant added successfully' });
    } catch (e) {
      const error = e as Error; // Explicitly cast 'e' to 'Error'
      res.status(400).json({ error: error.message });
    }
  });

// Route: Get all plants
app.get('/get_plants', (_req, res) => {
    try {
        console.log('GET /get_plants called');
        const plants = loadPlants();
        console.log(`Returning ${plants.length} plants`);
        return res.status(200).json(plants);
    } catch (e) {
        console.error('Error getting plants:', e);
        return res.status(500).json({ error: (e as Error).message });
    }
});

// Route: Get a single plant by ID
app.get('/get_plant/:id', (req, res) => {
    try {
        console.log(`GET /get_plant/${req.params.id} called`);
        const plantId = parseInt(req.params.id, 10);
        const plants = loadPlants();
        const plant = plants.find(p => p.id === plantId);

        if (!plant) {
            console.log(`Plant with ID ${plantId} not found`);
            return res.status(404).json({ error: 'Plant not found' });
        }

        console.log(`Returning plant with ID ${plantId}`);
        return res.status(200).json(plant);
    } catch (e) {
        console.error('Error getting plant:', e);
        return res.status(500).json({ error: (e as Error).message });
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