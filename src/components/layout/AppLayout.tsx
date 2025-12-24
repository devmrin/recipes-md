import { Sidebar } from '@/components/layout/Sidebar';
import { RecipeView } from '@/components/recipe/RecipeView';
import { useRouterState } from '@tanstack/react-router';

export function AppLayout() {
  const router = useRouterState();
  const recipeId = router.location.pathname.startsWith('/recipe/')
    ? router.location.pathname.split('/recipe/')[1]
    : undefined;

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-background">
        {recipeId ? (
          <RecipeView recipeId={recipeId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-semibold mb-3">Welcome to Pure Recipe</h2>
              <p className="text-muted-foreground mb-4">
                Add a recipe URL to get started, or select a recipe from the sidebar.
              </p>
              <p className="text-sm text-muted-foreground">
                Pure Recipe extracts recipes from popular cooking websites and saves them in a clean, readable format.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

