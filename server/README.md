# Pure Recipe Backend Server

Express server that handles recipe scraping to bypass CORS restrictions.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

The server will start on `http://localhost:3001` (or the port specified in `PORT` environment variable).

## API Endpoints

### POST `/api/scrape-recipe`

Scrapes a recipe from a URL and returns formatted markdown.

**Request Body:**
```json
{
  "url": "https://example.com/recipe"
}
```

**Response:**
```json
{
  "markdown": "# Recipe Title\n\n..."
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Environment Variables

- `PORT` - Server port (default: 3001)

