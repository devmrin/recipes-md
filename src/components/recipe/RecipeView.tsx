import { useEffect, useState } from 'react';
import { getRecipe, updateRecipe, deleteRecipe, getAllRecipes } from '@/lib/storage';
import type { Recipe } from '@/lib/storage';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { CopyButton } from '@/components/recipe/CopyButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Edit2, Save, X, Trash2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useNavigate } from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface RecipeViewProps {
  recipeId: string;
}

export function RecipeView({ recipeId }: RecipeViewProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRecipe() {
      try {
        setLoading(true);
        const data = await getRecipe(recipeId);
        if (!data) {
          setError('Recipe not found');
        } else {
          setRecipe(data);
          setEditedTitle(data.title);
          setEditedMarkdown(data.markdown);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipe');
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [recipeId]);

  const handleEdit = () => {
    if (recipe) {
      setEditedTitle(recipe.title);
      setEditedMarkdown(recipe.markdown);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    if (recipe) {
      setEditedTitle(recipe.title);
      setEditedMarkdown(recipe.markdown);
      setIsEditing(false);
    }
  };

  const handleSave = async () => {
    if (!recipe) return;

    setSaving(true);
    try {
      await updateRecipe(recipe.id, {
        title: editedTitle,
        markdown: editedMarkdown,
      });
      
      // Reload recipe to get updated data
      const updatedRecipe = await getRecipe(recipeId);
      if (updatedRecipe) {
        setRecipe(updatedRecipe);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
      console.error('Error saving recipe:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;

    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      
      // Get all remaining recipes
      const remainingRecipes = await getAllRecipes();
      
      // Navigate to the latest recipe (first in the list) or home if none remain
      if (remainingRecipes.length > 0) {
        navigate({ to: '/recipe/$id', params: { id: remainingRecipes[0].id } });
      } else {
        navigate({ to: '/' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
      console.error('Error deleting recipe:', err);
      setDeleting(false);
    }
  };

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
      <div className="border-b shrink-0 bg-background h-20">
        <div className="flex items-center justify-between gap-4 px-6 h-full py-4">
          <div className="flex-1 min-w-0 flex items-center">
            {isEditing ? (
              <Input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="!text-2xl md:!text-2xl font-bold break-words leading-8 !h-8 border-0 shadow-none px-0 py-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground rounded-none"
                placeholder="Recipe title..."
              />
            ) : (
              <h1 className="text-2xl font-bold break-words leading-8">{recipe.title}</h1>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="size-3.5" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !editedTitle.trim()}
                >
                  {saving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <CopyButton text={recipe.markdown} />
                <Button
                  variant="outline"
                  onClick={handleEdit}
                >
                  <Edit2 className="size-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        {isEditing ? (
          <div className="h-full">
            <Editor
              height="100%"
              language="markdown"
              value={editedMarkdown}
              onChange={(value) => setEditedMarkdown(value || '')}
              theme="vs"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                fontSize: 14,
                lineNumbers: 'on',
                renderWhitespace: 'selection',
                automaticLayout: true,
              }}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-6 py-6">
            <MarkdownRenderer content={recipe.markdown} />
          </div>
        )}
      </div>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

