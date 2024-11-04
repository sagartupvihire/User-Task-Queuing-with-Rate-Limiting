# Task Queue API with Rate Limiting

This Node.js application implements a task queuing system with rate limiting per user.

## Features

- Cluster mode with 2 replica sets
- Rate limiting: 1 task/second and 20 tasks/minute per user
- Redis-based queuing system
- Task logging to file
- Automatic queue processing
- Error handling and resilience

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Redis server locally or update .env with Redis credentials

3. Start the application:
   ```bash
   npm start
   ```

## API Endpoints

POST /task
- Body: { "user_id": "123" }
- Queues a task for processing

GET /health
- Health check endpoint

## Testing

```bash
npm test
```

## Architecture

- Uses Express.js for API
- Redis for queue management
- Winston for logging
- Cluster module for replica sets
- Rate limiting per user ID
- Automatic queue processing with backoff