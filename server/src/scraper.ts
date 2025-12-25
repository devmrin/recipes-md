/**
 * Server-side recipe scraper
 * Uses fetch to get HTML and extract recipe data using JSON-LD and HTML parsing
 */

interface ScrapedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  serves?: string;
  totalTime?: number;
  url: string;
}

/**
 * Checks if a string is likely a section header or metadata (not an actual ingredient/instruction).
 */
function isSectionHeader(text: string): boolean {
  const lower = text.toLowerCase().trim();
  
  // Common section header patterns
  const headerPatterns = [
    /^(ingredients|instructions|preparation|directions|steps|method)$/i,
    /^to make /i,
    /^how to /i,
    /^ingredients\s*\(/i, // "Ingredients (US cup = 240ml)"
    /^instructions\s*$/i,
    /^preparation\s*$/i,
    /^directions\s*$/i,
    /^steps\s*$/i,
    /^method\s*$/i,
    /^\d+\s+(preparation|instructions|directions|steps|method)$/i, // "1 Preparation", "2 Instructions"
    /^(preparation|instructions|directions|steps|method)\s*$/i,
    /^instructions?preparation$/i, // "InstructionsPreparation"
    /^instructions?preparation\s*$/i,
  ];
  
  return headerPatterns.some(pattern => pattern.test(lower));
}

/**
 * Checks if a string is likely metadata or non-recipe content.
 */
function isMetadata(text: string): boolean {
  const lower = text.toLowerCase().trim();
  
  // Metadata patterns
  const metadataPatterns = [
    /^ingredients?\s*\(/i, // "Ingredients (US cup = 240ml)"
    /^instructions?\s*$/i,
    /^\(us cup\s*=/i,
    /^\(.*cup.*\)$/i,
    /^serves?:/i,
    /^yield:/i,
    /^prep time:/i,
    /^cook time:/i,
    /^total time:/i,
  ];
  
  return metadataPatterns.some(pattern => pattern.test(lower));
}

/**
 * Removes checkboxes (▢) and other formatting characters from text.
 */
function removeCheckboxes(text: string): string {
  // Remove checkbox character (▢) and any leading whitespace after it
  return text.replace(/▢\s*/g, '').trim();
}

/**
 * Splits a string that may contain multiple items separated by checkboxes or newlines.
 */
function splitItems(text: string): string[] {
  // Split by checkbox, newline, or if it's a very long string
  const items = text
    .split(/▢|\n/)
    .map(item => removeCheckboxes(item))
    .filter(item => item.length > 0);
  
  return items.length > 0 ? items : [text];
}

/**
 * Normalizes double parentheses and trims whitespace inside parentheses in ingredient strings.
 */
function normalizeIngredientParentheses(ingredient: string): string {
  // Remove checkboxes first
  ingredient = removeCheckboxes(ingredient);
  
  // Fix double parentheses: ((text)) -> (text)
  ingredient = ingredient.replace(/\(\(([^)]+)\)\)/g, '($1)');
  // Fix space before opening parenthesis: ( (text)) -> (text)
  ingredient = ingredient.replace(/\(\s*\(([^)]+)\)\)/g, '($1)');
  // Fix any remaining double parentheses patterns
  ingredient = ingredient.replace(/\(\(([^)]+)\)\)/g, '($1)');
  // Trim whitespace inside parentheses: (text ) -> (text) or ( text) -> (text)
  ingredient = ingredient.replace(/\(([^)]+)\)/g, (_match, content) => `(${content.trim()})`);
  
  return ingredient.trim();
}

/**
 * Cleans and normalizes an array of ingredients, handling cases where they might be strings with checkboxes.
 */
function normalizeIngredients(ingredients: string[]): string[] {
  const normalized: string[] = [];
  
  for (const ingredient of ingredients) {
    if (typeof ingredient !== 'string') continue;
    
    let cleaned = ingredient.trim();
    
    // Skip empty strings
    if (!cleaned) continue;
    
    // Skip section headers and metadata
    if (isSectionHeader(cleaned) || isMetadata(cleaned)) {
      continue;
    }
    
    // If the ingredient contains checkboxes, split it
    if (cleaned.includes('▢')) {
      const split = splitItems(cleaned);
      for (const item of split) {
        const normalizedItem = normalizeIngredientParentheses(item);
        // Skip section headers in split items too
        if (normalizedItem && !isSectionHeader(normalizedItem) && !isMetadata(normalizedItem)) {
          normalized.push(normalizedItem);
        }
      }
    } else {
      const normalizedItem = normalizeIngredientParentheses(cleaned);
      if (normalizedItem && !isSectionHeader(normalizedItem) && !isMetadata(normalizedItem)) {
        normalized.push(normalizedItem);
      }
    }
  }
  
  // Remove duplicates while preserving order (using fuzzy matching for similar items)
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const item of normalized) {
    const key = item.toLowerCase().trim();
    
    // Skip if exact duplicate
    if (seen.has(key)) continue;
    
    // Skip very short items that are likely fragments (less than 3 characters, unless it's a number/unit)
    if (key.length < 3 && !/^\d+$/.test(key) && !/^[a-z]$/i.test(key)) {
      continue;
    }
    
    // Skip if it's a substring of an already seen item (likely a broken ingredient/instruction)
    let isSubstring = false;
    for (const seenKey of seen) {
      // Only consider it a substring if the difference is significant (at least 5 chars)
      if (key.length < seenKey.length && seenKey.includes(key) && seenKey.length - key.length >= 5) {
        isSubstring = true;
        break;
      }
      if (key.length > seenKey.length && key.includes(seenKey) && key.length - seenKey.length >= 5) {
        // Remove the shorter duplicate
        const index = result.findIndex(r => r.toLowerCase().trim() === seenKey);
        if (index !== -1) {
          result.splice(index, 1);
          seen.delete(seenKey);
        }
        break;
      }
    }
    
    if (!isSubstring) {
      seen.add(key);
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Cleans instruction text by removing leading numbers and section headers.
 */
function cleanInstructionText(text: string): string {
  let cleaned = text.trim();
  
  // Remove "Instructions" prefix if concatenated (e.g., "InstructionsPreparation" -> "Preparation")
  cleaned = cleaned.replace(/^instructions?/i, '').trim();
  
  // Remove leading numbers followed ONLY by section headers with no other content
  // (e.g., "1 Preparation" with nothing else -> "", but "1 Cut gobi..." -> "Cut gobi...")
  // First check if it's just a number + section header
  const justHeaderMatch = cleaned.match(/^(\d+)\s+(preparation|instructions|directions|steps|method)\s*$/i);
  if (justHeaderMatch) {
    // If it's just "1 Preparation" or similar, remove it entirely
    return '';
  }
  
  // Remove leading number if followed by section header word (but keep rest of content)
  // e.g., "1 Preparation step" -> "Preparation step" (we'll remove "Preparation" next if needed)
  cleaned = cleaned.replace(/^\d+\s+(preparation|instructions|directions|steps|method)\s+/i, '').trim();
  
  // Remove section headers that are standalone (no other content)
  if (/^(preparation|instructions|directions|steps|method)\s*$/i.test(cleaned)) {
    return '';
  }
  
  // Remove leading section header words followed by space (but keep the rest)
  cleaned = cleaned.replace(/^(preparation|instructions|directions|steps|method)\s+/i, '').trim();
  
  // Remove leading numbers that are likely step numbers (since formatter will add them)
  // But only if they're at the very start and followed by a space
  cleaned = cleaned.replace(/^\d+\.?\s+/, '').trim();
  
  return cleaned;
}

/**
 * Cleans and normalizes an array of instructions, handling cases where they might be strings with checkboxes.
 */
function normalizeInstructions(instructions: string[]): string[] {
  const normalized: string[] = [];
  
  for (const instruction of instructions) {
    if (typeof instruction !== 'string') continue;
    
    // Remove checkboxes and clean up
    let cleaned = removeCheckboxes(instruction);
    
    // Clean instruction text
    cleaned = cleanInstructionText(cleaned);
    
    // Skip empty strings
    if (!cleaned) continue;
    
    // Skip section headers and metadata
    if (isSectionHeader(cleaned) || isMetadata(cleaned)) {
      continue;
    }
    
    // If the instruction contains multiple checkboxes, split it
    if (instruction.includes('▢') && instruction.split('▢').length > 2) {
      const split = splitItems(instruction);
      for (const item of split) {
        let cleanedItem = cleanInstructionText(item.trim());
        // Skip section headers in split items too
        if (cleanedItem && !isSectionHeader(cleanedItem) && !isMetadata(cleanedItem)) {
          normalized.push(cleanedItem);
        }
      }
    } else {
      // Clean up extra whitespace and newlines
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      // Skip if it's just a section header word
      if (cleaned.length > 0 && !isSectionHeader(cleaned) && !isMetadata(cleaned)) {
        normalized.push(cleaned);
      }
    }
  }
  
  // Remove duplicates while preserving order (using fuzzy matching for similar items)
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const item of normalized) {
    const key = item.toLowerCase().trim();
    
    // Skip if exact duplicate
    if (seen.has(key)) continue;
    
    // Skip very short items that are likely fragments (less than 5 characters for instructions)
    if (key.length < 5 && !/^\d+/.test(key)) {
      continue;
    }
    
    // Skip if it's a substring of an already seen item (likely a broken instruction)
    let isSubstring = false;
    for (const seenKey of seen) {
      // Only consider it a substring if the difference is significant (at least 10 chars for instructions)
      if (key.length < seenKey.length && seenKey.includes(key) && seenKey.length - key.length >= 10) {
        isSubstring = true;
        break;
      }
      if (key.length > seenKey.length && key.includes(seenKey) && key.length - seenKey.length >= 10) {
        // Remove the shorter duplicate
        const index = result.findIndex(r => r.toLowerCase().trim() === seenKey);
        if (index !== -1) {
          result.splice(index, 1);
          seen.delete(seenKey);
        }
        break;
      }
    }
    
    if (!isSubstring) {
      seen.add(key);
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Formats recipe data into markdown matching the Python version's format.
 * Note: Title is NOT included in markdown as it's displayed separately in the UI.
 */
function formatRecipeToMarkdown(recipe: ScrapedRecipe, includeTime: boolean = true, includeYield: boolean = true): string {
  let markdown = `**Link to original recipe:** ${recipe.url}\n\n`;

  if (includeYield && recipe.serves) {
    markdown += `**Serves:** ${recipe.serves}\n`;
  }
  if (includeTime && recipe.totalTime) {
    markdown += `**Total Time:** ${recipe.totalTime} mins\n`;
  }

  // Normalize ingredients before formatting
  const normalizedIngredients = normalizeIngredients(recipe.ingredients);
  markdown += `\n## Ingredients\n\n`;
  for (const ingredient of normalizedIngredients) {
    markdown += `- ${ingredient}\n`;
  }

  // Normalize instructions before formatting
  const normalizedInstructions = normalizeInstructions(recipe.instructions);
  markdown += `\n## Instructions\n\n`;
  for (let i = 0; i < normalizedInstructions.length; i++) {
    markdown += `${i + 1}. ${normalizedInstructions[i]}\n`;
  }

  return markdown;
}

/**
 * Extracts recipe data from JSON-LD structured data.
 */
function extractFromJsonLd(html: string): ScrapedRecipe | null {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  const matches = Array.from(html.matchAll(jsonLdRegex));

  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]) as unknown;
      const recipe = Array.isArray(data) 
        ? (data as Array<Record<string, unknown>>).find((item) => item['@type'] === 'Recipe')
        : data as Record<string, unknown>;
      
      if (recipe && recipe['@type'] === 'Recipe') {
        let ingredients: string[] = [];
        if (Array.isArray(recipe.recipeIngredient)) {
          ingredients = recipe.recipeIngredient
            .map((item: unknown) => typeof item === 'string' ? item : String(item))
            .map(item => item.trim())
            .filter(item => item.length > 0);
        } else if (recipe.ingredients) {
          ingredients = Array.isArray(recipe.ingredients) 
            ? recipe.ingredients
                .map((item: unknown) => typeof item === 'string' ? item : String(item))
                .map(item => item.trim())
                .filter(item => item.length > 0)
            : [String(recipe.ingredients)].map(item => item.trim()).filter(item => item.length > 0);
        }
        
        // Handle case where ingredients might be a single string with checkboxes
        if (ingredients.length === 1 && ingredients[0].includes('▢')) {
          ingredients = splitItems(ingredients[0]);
        }
        
        // Filter out section headers and metadata before returning
        ingredients = ingredients.filter(item => !isSectionHeader(item) && !isMetadata(item));
        
        let instructions: string[] = [];
        if (recipe.recipeInstructions) {
          if (Array.isArray(recipe.recipeInstructions)) {
            instructions = recipe.recipeInstructions
              .map((step: unknown) => {
                if (typeof step === 'string') return step.trim();
                if (typeof step === 'object' && step !== null && 'text' in step) {
                  return String((step as { text: unknown }).text).trim();
                }
                if (typeof step === 'object' && step !== null && '@type' in step && step['@type'] === 'HowToStep' && 'text' in step) {
                  return String((step as { text: unknown }).text).trim();
                }
                return '';
              })
              .filter(Boolean)
              .filter(item => item.length > 0);
          } else if (typeof recipe.recipeInstructions === 'string') {
            instructions = [recipe.recipeInstructions.trim()].filter(item => item.length > 0);
          }
        }
        
        // Handle case where instructions might be a single string with checkboxes
        if (instructions.length === 1 && instructions[0].includes('▢')) {
          instructions = splitItems(instructions[0]);
        }
        
        // Filter out section headers and metadata before returning
        instructions = instructions.filter(item => !isSectionHeader(item) && !isMetadata(item));

        return {
          title: String(recipe.name || ''),
          ingredients,
          instructions,
          serves: recipe.recipeYield ? String(recipe.recipeYield) : recipe.yield ? String(recipe.yield) : undefined,
          totalTime: recipe.totalTime ? parseTime(recipe.totalTime as string | number) : undefined,
          url: String(recipe.url || ''),
        };
      }
    } catch {
      // Continue to next match
    }
  }

  return null;
}

/**
 * Parses ISO 8601 duration or minutes to number.
 */
function parseTime(time: string | number): number | undefined {
  if (typeof time === 'number') return time;
  
  // If it's already a number string, parse it
  const num = parseInt(time, 10);
  if (!isNaN(num)) return num;

  // Try to parse ISO 8601 duration (PT30M, PT1H30M, etc.)
  const durationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?/;
  const match = time.match(durationRegex);
  if (match) {
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
  }

  return undefined;
}

/**
 * Fallback extraction using meta tags and common HTML patterns.
 */
async function extractFromMetaTags(html: string, url: string): Promise<ScrapedRecipe | null> {
  const cheerio = await import('cheerio');
  const $ = cheerio.load(html);

  // Try to get title
  const title = $('h1').first().text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                $('title').text().trim() ||
                'Untitled Recipe';

  // Try to find ingredients (common patterns)
  const ingredientSelectors = [
    '[itemprop="recipeIngredient"]',
    '.ingredient',
    '.ingredients li',
    '[class*="ingredient"]',
  ];

  const ingredients: string[] = [];
  for (const selector of ingredientSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_, el) => {
        const text = $(el).text().trim();
        // Filter out section headers and metadata
        if (text && !isSectionHeader(text) && !isMetadata(text)) {
          ingredients.push(text);
        }
      });
      break;
    }
  }

  // Try to find instructions
  const instructionSelectors = [
    '[itemprop="recipeInstructions"] li',
    '[itemprop="recipeInstructions"] p',
    '.instruction',
    '.instructions li',
    '[class*="instruction"]',
  ];

  const instructions: string[] = [];
  for (const selector of instructionSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_, el) => {
        const text = $(el).text().trim();
        // Filter out section headers and metadata
        if (text && !isSectionHeader(text) && !isMetadata(text)) {
          instructions.push(text);
        }
      });
      break;
    }
  }

  if (ingredients.length === 0 && instructions.length === 0) {
    return null;
  }

  // Handle case where ingredients might be a single string with checkboxes
  let processedIngredients = ingredients;
  if (ingredients.length === 1 && ingredients[0].includes('▢')) {
    processedIngredients = splitItems(ingredients[0]);
  }
  
  // Handle case where instructions might be a single string with checkboxes
  let processedInstructions = instructions;
  if (instructions.length === 1 && instructions[0].includes('▢')) {
    processedInstructions = splitItems(instructions[0]);
  }

  return {
    title,
    ingredients: processedIngredients,
    instructions: processedInstructions,
    url,
  };
}

/**
 * Scrapes a recipe from a URL and returns recipe data including title, markdown, and metadata.
 */
export async function scrapeRecipe(url: string): Promise<{
  title: string;
  markdown: string;
  serves?: string;
  totalTime?: number;
}> {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Try JSON-LD first (most reliable)
    let recipe = extractFromJsonLd(html);
    
    // Fallback to meta tags and HTML parsing
    if (!recipe || recipe.ingredients.length === 0) {
      recipe = await extractFromMetaTags(html, url);
    }

    if (!recipe || recipe.ingredients.length === 0) {
      throw new Error('Could not extract recipe data from this URL. The site may not be supported.');
    }

    // Ensure we have a valid title
    if (!recipe.title || recipe.title.trim() === '') {
      recipe.title = 'Untitled Recipe';
    }

    return {
      title: recipe.title,
      markdown: formatRecipeToMarkdown(recipe),
      serves: recipe.serves,
      totalTime: recipe.totalTime,
    };
  } catch (error) {
    throw new Error(`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

