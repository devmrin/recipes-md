import { AddRecipeForm } from '@/components/recipe/AddRecipeForm';
import { RecipeList } from '@/components/layout/RecipeList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function Sidebar() {
  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col h-full overflow-hidden">
      <Card className="border-0 shadow-none rounded-none flex-shrink-0">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4" />
            Cookbook
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 border-b">
          <AddRecipeForm />
        </CardContent>
      </Card>
      <div className="flex-1 min-h-0">
        <RecipeList />
      </div>
    </div>
  );
}

