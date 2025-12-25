import { AddRecipeForm } from '@/components/recipe/AddRecipeForm';
import { RecipeList } from '@/components/layout/RecipeList';

export function Sidebar() {
  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b bg-card h-20 flex items-center">
        <div className="px-4 py-4 flex-1">
          <AddRecipeForm />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <RecipeList />
      </div>
    </div>
  );
}

