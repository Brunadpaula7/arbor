import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Serve all static files from root directory
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// Route fallback to main index.html for unknown GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Arbor Imóveis web server running at http://${HOST}:${PORT}`);
});
