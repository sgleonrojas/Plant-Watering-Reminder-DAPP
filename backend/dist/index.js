import express from "express";
import cors from "cors"; // Import the CORS middleware
const app = express();
const PORT = 5000;
// Enable CORS
app.use(cors());
app.get("/", (_req, res) => {
    res.send("Hello, Plant Watering Reminder!");
});
// Example route for fetching reminders
app.get("/get_reminders", (_req, res) => {
    res.json({ reminders: [] }); // Replace with actual logic
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map