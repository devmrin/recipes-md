import express from 'express';
import cors from 'cors';
import { scrapeRecipe } from './scraper.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Recipe scraping endpoint
app.post('/api/scrape-recipe', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const result = await scrapeRecipe(url);
    
    res.json(result);
  } catch (error) {
    console.error('Error scraping recipe:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to scrape recipe' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

