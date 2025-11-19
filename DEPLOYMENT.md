# Deployment Guide - GCSE PAL

This guide covers deploying the GCSE PAL platform to Vercel.

## Prerequisites

1. Vercel account
2. GitHub repository connected to Vercel
3. Required service accounts and API keys

## Environment Variables

Required environment variables for deployment:

### Authentication (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `CLERK_WEBHOOK_SECRET` - (Optional) For user synchronization

### AI Services
- `ANTHROPIC_API_KEY` - Your Anthropic API key for AI functionality

### Database
- `DATABASE_URL` - PostgreSQL connection string (Vercel Postgres or external)

### Video Processing (Mux)
- `MUX_TOKEN_ID` - Mux token ID
- `MUX_TOKEN_SECRET` - Mux token secret
- `MUX_WEBHOOK_SIGNING_SECRET` - Mux webhook signing secret

### Application
- `NEXT_PUBLIC_APP_URL` - Your deployed app URL (e.g., https://your-app.vercel.app)
- `MCP_SERVER_URL` - (Optional) xMCP server URL, defaults to http://localhost:3001/mcp

## Database Setup

### Option 1: Vercel Postgres (Recommended)
1. In your Vercel project dashboard, go to Storage
2. Create a new Postgres database
3. Copy the connection string to your `DATABASE_URL` environment variable

### Option 2: External PostgreSQL
1. Set up a PostgreSQL database with any provider
2. Ensure the database is accessible from Vercel
3. Add the connection string as `DATABASE_URL`

## Deployment Steps

### 1. Connect Repository to Vercel
```bash
# If not already done, connect your GitHub repository
vercel link
```

### 2. Set Environment Variables
In your Vercel project dashboard:
1. Go to Settings → Environment Variables
2. Add all required environment variables from the list above
3. Make sure to select the appropriate environments (Production, Preview, Development)

### 3. Deploy
```bash
# Deploy to production
vercel --prod

# Or push to your main branch and let Vercel auto-deploy
git push origin main
```

## Post-Deployment Tasks

### 1. Database Migration
After deployment, you may need to run database migrations:

```bash
# Locally, targeting your production database
DATABASE_URL=your_production_db_url npm run db:migrate

# Or use Vercel CLI
vercel env pull .env.production
npm run db:migrate
```

### 2. Configure Webhooks
- Set up Clerk webhook pointing to `https://your-app.vercel.app/api/webhooks/clerk`
- Set up Mux webhook pointing to `https://your-app.vercel.app/api/webhooks/mux`

### 3. Verify Services
- Test user authentication
- Verify AI functionality works
- Test video upload and processing

## Troubleshooting

### Build Issues
- If builds fail due to memory, the `NODE_OPTIONS` is already configured for 4GB max heap
- TypeScript errors are ignored during build for stability

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set
- Check if your database allows connections from Vercel's IP ranges
- Verify SSL settings in your connection string

### Missing Environment Variables
- Check that all required variables are set in Vercel dashboard
- Ensure sensitive variables are not committed to git

## Monitoring

- Check Vercel Logs for any runtime errors
- Monitor database performance through your provider's dashboard
- Set up error tracking (consider integrating with a service like Sentry)

## Security Considerations

- All secret keys should be environment variables, never committed to code
- Use HTTPS for all API endpoints
- Regularly rotate API keys and secrets
- Review Clerk authentication configuration
- Ensure CORS is properly configured for your domains

## Performance Optimization

- The app is configured with Next.js optimizations
- Images are optimized for web delivery
- Database queries are optimized with proper indexing
- Consider enabling Vercel Analytics for performance monitoring