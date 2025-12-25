import { useEffect, useState } from 'react';
import { getRecipe, updateRecipe } from '@/lib/storage';
import type { Recipe } from '@/lib/storage';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { CopyButton } from '@/components/recipe/CopyButton';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Edit2, Save, X } from 'lucide-react';
import Editor from '@monaco-editor/react';

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
            {isEditing ? (
              <div className="p-6 space-y-4">
                <Textarea
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-2xl font-bold min-h-[60px] resize-none"
                  placeholder="Recipe title..."
                />
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
            ) : (
              <>
                <h1 className="p-6 text-2xl font-bold mb-2 break-words">{recipe.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground px-6">
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
              </>
            )}
          </div>
          <div className="shrink-0 pr-6 flex items-center gap-2">
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
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
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
          <div className="flex-1 overflow-y-auto p-6">
            <MarkdownRenderer content={recipe.markdown} />
          </div>
        )}
      </div>
    </div>
  );
}

