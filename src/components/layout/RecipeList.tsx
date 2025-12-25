import { useEffect, useState, useMemo } from 'react';
import type { Recipe } from '@/lib/storage';
import { getAllRecipes } from '@/lib/storage';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouterState } from '@tanstack/react-router';

export function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouterState();
  const currentRecipeId = router.location.pathname.startsWith('/recipe/')
    ? router.location.pathname.split('/recipe/')[1]
    : undefined;

  useEffect(() => {
    async function loadRecipes() {
      try {
        const allRecipes = await getAllRecipes();
        setRecipes(allRecipes);
      } catch (err) {
        console.error('Error loading recipes:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();

    // Refresh recipes periodically (IndexedDB doesn't have great event support)
    // In a production app, you might want to use a state management solution
    const interval = setInterval(loadRecipes, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const query = searchQuery.toLowerCase();
    return recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.markdown.toLowerCase().includes(query)
    );
  }, [recipes, searchQuery]);

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-2">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No recipes found' : 'No recipes yet. Add one to get started!'}
            </p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isActive={recipe.id === currentRecipeId}
            />
          ))
        )}
      </div>
    </div>
  );
}

