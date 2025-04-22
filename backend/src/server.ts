import { Request, Response } from 'express';
import express from 'express';


const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Define request and response types explicitly
app.get('/', (_req: Request, res: Response) => {
    res.send('Backend is running!');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
