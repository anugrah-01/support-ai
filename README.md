
1. Move into the backend directory and install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in `backend/`:

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/support_ai?schema=public"
   JWT_SECRET="replace-with-a-long-random-secret"
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

3. Make sure PostgreSQL and Redis are running. The Redis connection currently uses `127.0.0.1:6379`.

4. Generate the Prisma client and apply the checked-in migrations:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

5. Start the API in development:

   ```bash
   npm run dev
   ```

6. In a second terminal, from `backend/`, start the ticket worker:

   ```bash
   npx tsx src/workers/ticket.worker.ts
   ```

The worker handles embedding and reply generation after a ticket is created. The API health check is available at [http://localhost:3000/health](http://localhost:3000/health).

For a production build, run `npm run build`, then `npm start`. Run the worker process separately in production as well.

## API overview

All routes are mounted on the Express app. Except registration, login, and the health check, the ticket routes require an `Authorization: Bearer <token>` header.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| POST | `/api/tickets` | Create a ticket |
| GET | `/api/tickets` | List tickets with pagination and filters |
| GET | `/api/tickets/search?query=...` | Find similar tickets |
| GET | `/api/tickets/knowledge-search?query=...` | Search knowledge chunks |
| GET | `/api/tickets/generate-support-reply?query=...` | Generate a reply from retrieved knowledge |
| GET | `/api/tickets/:id` | Get one ticket |
| PATCH | `/api/tickets/:id` | Update a ticket |
| DELETE | `/api/tickets/:id` | Delete a ticket |
| POST | `/api/tickets/:id/regenerate-reply` | Regenerate a ticket reply |

The list endpoint supports pagination and filters for AI status, priority, ticket status, category, and text search. It also supports sorting by selected ticket fields.

Two unauthenticated development endpoints are available at `/api/ai/test` and `/api/ai/embedding-test`.

## Data and knowledge base

The Prisma schema defines `User`, `Ticket`, and `KnowledgeChunk` models. Support replies retrieve up to three similar knowledge chunks and instruct Gemini to answer only from that retrieved content. The repository does not currently include a knowledge-base import or seed command, so knowledge chunks must be populated separately for grounded replies.

## Available npm scripts

From `backend/`:

- `npm run dev` — run the API with TypeScript watch mode
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled API

## Notes

- The API and ticket worker are separate processes; both need access to the same PostgreSQL database, Redis instance, and Gemini API key.
- Ticket analysis is performed while handling ticket creation. Embedding and support-reply generation are queued for background processing.
- The AI integration uses the `gemini-3-flash-preview` model for generation and `gemini-embedding-001` for embeddings.
