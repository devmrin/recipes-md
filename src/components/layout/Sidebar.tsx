import { AddRecipeForm } from '@/components/recipe/AddRecipeForm';
import { RecipeList } from '@/components/layout/RecipeList';
import { BookOpen } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b bg-card h-24">
        <div className="px-4 pt-4 pb-2 flex items-center">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="size-4" />
            Cookbook
          </h2>
        </div>
        <div className="px-4 pt-2 pb-4">
          <AddRecipeForm />
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <RecipeList />
      </div>
    </div>
  );
}

