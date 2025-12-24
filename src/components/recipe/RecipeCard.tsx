import type { Recipe } from '@/lib/storage';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  isActive?: boolean;
}

export function RecipeCard({ recipe, isActive }: RecipeCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: '/recipe/$id', params: { id: recipe.id } });
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:bg-muted/50',
        isActive && 'ring-2 ring-primary'
      )}
      onClick={handleClick}
    >
      <CardHeader>
        <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
        <CardDescription>
          {format(new Date(recipe.createdAt), 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

