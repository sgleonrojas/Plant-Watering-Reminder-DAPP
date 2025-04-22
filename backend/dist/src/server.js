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

// Helper function to load pets.json
function loadPets() {
    const filePath = path.join(__dirname, '../pets.json');  // Ensure the file path is correct
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Helper function to save pets.json
function savePets(pets) {
    const filePath = path.join(__dirname, '../pets.json');  // Ensure the file path is correct
    fs.writeFileSync(filePath, JSON.stringify(pets, null, 2), 'utf8');
}

// Default route (checking if server is running)
app.get('/', (_req, res) => {
    res.send('Backend is running!');
});

// Route: Add a pet
app.post('/add_pet', (req, res) => {
    try {
        const petData = req.body;  // The pet data should be sent in JSON format
        let pets = loadPets();
        
        // Add new pet
        pets.push(petData);
        
        // Save updated list back to pets.json
        savePets(pets);
        
        return res.status(200).json({ message: 'Pet added successfully' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Route: Get total number of pets
app.get('/total_pets', (_req, res) => {
    try {
        const pets = loadPets();
        return res.status(200).json({ totalPets: pets.length });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// Route: Get reminders (pets that need watering soon)
app.get('/get_reminders', (_req, res) => {
    try {
        const pets = loadPets();
        const currentTime = new Date();
        const reminders = [];

        pets.forEach(pet => {
            const [scheduledHour, scheduledMinute] = pet.age.split(':').map(Number);  // Assuming 'age' is the scheduled time in HH:MM

            const currentHour = currentTime.getHours();
            const currentMinute = currentTime.getMinutes();

            if (currentHour === scheduledHour && Math.abs(currentMinute - scheduledMinute) <= 5) {
                reminders.push(pet);
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
