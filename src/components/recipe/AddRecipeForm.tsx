import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { scrapeRecipe } from '@/lib/recipe-scraper';
import { saveRecipe } from '@/lib/storage';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, Plus } from 'lucide-react';

export function AddRecipeForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Scrape the recipe
      const recipeData = await scrapeRecipe(url.trim());

      // Extract URL from markdown
      const urlMatch = recipeData.markdown.match(/\*\*Link to original recipe:\*\*\s+(.+)$/m);
      const recipeUrl = urlMatch ? urlMatch[1] : url.trim();

      // Save to IndexedDB
      const recipe = await saveRecipe({
        title: recipeData.title,
        url: recipeUrl,
        markdown: recipeData.markdown,
        serves: recipeData.serves,
        totalTime: recipeData.totalTime,
      });

      // Navigate to the new recipe
      navigate({ to: '/recipe/$id', params: { id: recipe.id } });

      // Reset form
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape recipe');
      console.error('Error scraping recipe:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Paste recipe URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !url.trim()}>
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="size-3.5" />
              Add
            </>
          )}
        </Button>
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
          {error}
        </div>
      )}
    </form>
  );
}

