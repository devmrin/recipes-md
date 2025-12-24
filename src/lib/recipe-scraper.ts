/**
 * Recipe scraper client
 * 
 * Calls the backend API to scrape recipes, bypassing CORS restrictions.
 */

/**
 * Scrapes a recipe from a URL and returns recipe data including title, markdown, and metadata.
 * Uses backend proxy to bypass CORS restrictions.
 */
export async function scrapeRecipe(url: string): Promise<{
  title: string;
  markdown: string;
  serves?: string;
  totalTime?: number;
}> {
  const proxyUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  try {
    const response = await fetch(`${proxyUrl}/api/scrape-recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `Failed to scrape recipe: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.markdown || !data.title) {
      throw new Error('Invalid response from server: missing markdown or title');
    }

    return {
      title: data.title,
      markdown: data.markdown,
      serves: data.serves,
      totalTime: data.totalTime,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Failed to connect to backend server. Make sure the server is running: ' +
        'cd server && pnpm dev'
      );
    }
    throw error;
  }
}


