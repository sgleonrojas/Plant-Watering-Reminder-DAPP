import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = 4000;

app.use('/api', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));

app.listen(port, () => {
    console.log(`API Gateway running on http://localhost:${port}`);
});
