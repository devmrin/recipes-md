import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Recipe } from './storage';
import { getAllRecipes, saveRecipe, deleteRecipe, updateRecipe } from './storage';

interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  refreshRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe>;
  removeRecipe: (id: string) => Promise<void>;
  updateRecipeInList: (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRecipes = useCallback(async () => {
    try {
      const allRecipes = await getAllRecipes();
      setRecipes(allRecipes);
    } catch (err) {
      console.error('Error loading recipes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecipe = useCallback(async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Optimistically add the recipe to the list
    const tempId = crypto.randomUUID();
    const now = new Date();
    const tempRecipe: Recipe = {
      ...recipeData,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };
    
    // Add optimistically (will be replaced with real data after save)
    setRecipes((prev) => [tempRecipe, ...prev]);

    try {
      // Save to IndexedDB
      const savedRecipe = await saveRecipe(recipeData);
      
      // Replace temp recipe with saved recipe (which has the correct ID)
      setRecipes((prev) => {
        const filtered = prev.filter((r) => r.id !== tempId);
        return [savedRecipe, ...filtered];
      });
      
      return savedRecipe;
    } catch (err) {
      // On error, remove the optimistic recipe
      setRecipes((prev) => prev.filter((r) => r.id !== tempId));
      throw err;
    }
  }, []);

  const removeRecipe = useCallback(async (id: string) => {
    // Optimistically remove from list
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    
    try {
      await deleteRecipe(id);
      // Refresh to ensure consistency
      await refreshRecipes();
    } catch (err) {
      // On error, refresh to restore the recipe
      await refreshRecipes();
      throw err;
    }
  }, [refreshRecipes]);

  const updateRecipeInList = useCallback(async (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => {
    // Optimistically update in list
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, ...updates, updatedAt: new Date() }
          : r
      )
    );

    try {
      await updateRecipe(id, updates);
      // Refresh to ensure consistency
      await refreshRecipes();
    } catch (err) {
      // On error, refresh to restore correct data
      await refreshRecipes();
      throw err;
    }
  }, [refreshRecipes]);

  useEffect(() => {
    refreshRecipes();
    
    // Keep polling as a fallback for external changes (e.g., from another tab)
    // But reduce frequency since we now have optimistic updates
    const interval = setInterval(refreshRecipes, 5000);
    return () => clearInterval(interval);
  }, [refreshRecipes]);

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        loading,
        refreshRecipes,
        addRecipe,
        removeRecipe,
        updateRecipeInList,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
}

