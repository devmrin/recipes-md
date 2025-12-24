import { useEffect, useState } from 'react';
import { getRecipe } from '@/lib/storage';
import type { Recipe } from '@/lib/storage';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { CopyButton } from '@/components/recipe/CopyButton';
import { Loader2 } from 'lucide-react';

interface RecipeViewProps {
  recipeId: string;
}

export function RecipeView({ recipeId }: RecipeViewProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipe() {
      try {
        setLoading(true);
        const data = await getRecipe(recipeId);
        if (!data) {
          setError('Recipe not found');
        } else {
          setRecipe(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipe');
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [recipeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">{error || 'Recipe not found'}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="border-b pb-4 shrink-0 bg-background">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="p-6 text-2xl font-bold mb-2 break-words">{recipe.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {recipe.serves && (
                <span>
                  Serves: {recipe.serves}
                </span>
              )}
              {recipe.totalTime && (
                <span>
                  Total Time: {recipe.totalTime} mins
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 pr-6">
            <CopyButton text={recipe.markdown} />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <MarkdownRenderer content={recipe.markdown} />
      </div>
    </div>
  );
}

