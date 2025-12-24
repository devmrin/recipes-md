import Dexie, { type Table } from 'dexie';

export interface Recipe {
  id: string;
  title: string;
  url: string;
  markdown: string;
  createdAt: Date;
  updatedAt: Date;
  serves?: string;
  totalTime?: number;
}

class RecipeDatabase extends Dexie {
  recipes!: Table<Recipe>;

  constructor() {
    super('RecipeDatabase');
    this.version(1).stores({
      recipes: 'id, title, createdAt, updatedAt',
    });
  }
}

const db = new RecipeDatabase();

export async function saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
  const id = crypto.randomUUID();
  const now = new Date();
  const newRecipe: Recipe = {
    ...recipe,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await db.recipes.add(newRecipe);
  return newRecipe;
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  return await db.recipes.get(id);
}

export async function getAllRecipes(): Promise<Recipe[]> {
  return await db.recipes.orderBy('createdAt').reverse().toArray();
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id);
}

export async function updateRecipe(id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>): Promise<void> {
  await db.recipes.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export { db };

