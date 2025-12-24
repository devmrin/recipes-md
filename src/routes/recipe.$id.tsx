import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/AppLayout';

export const Route = createFileRoute('/recipe/$id')({
  component: RecipePage,
});

function RecipePage() {
  return <AppLayout />;
}

