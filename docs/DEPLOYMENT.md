# Vercel Deployment Guide

This repository is now ready for Vercel deployment. Follow these steps to deploy your GCSE Pal platform.

## Prerequisites

- Vercel account
- PostgreSQL database (Vercel Postgres or external)
- Clerk account for authentication
- Anthropic API key for AI functionality

## Environment Variables

Configure these environment variables in your Vercel project:

### Required Variables

1. **Database URL**
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

2. **Clerk Authentication**
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

3. **Anthropic API**
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### Optional Variables

```
MCP_SERVER_URL=https://your-xmcp-server.com/mcp
```

## Database Setup

### Option 1: Vercel Postgres (Recommended)
1. In your Vercel project, go to Storage
2. Create a new Postgres database
3. The `DATABASE_URL` will be automatically configured

### Option 2: External PostgreSQL
1. Set up a PostgreSQL database elsewhere
2. Add the connection string as `DATABASE_URL`

### Database Migrations
After deployment, you'll need to run database migrations:

```bash
# Clone your repo locally with production env vars
git clone your-repo
cd your-repo/apps/platform

# Install dependencies
pnpm install

# Run migrations
pnpm db:migrate
```

## Deployment Steps

1. **Connect your repository to Vercel**
   - Import your Git repository
   - Vercel will auto-detect the Next.js app

2. **Configure Build Settings**
   - Root Directory: `apps/platform`
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`

3. **Set Environment Variables**
   - Add all required environment variables
   - Use Vercel's encrypted environment variables

4. **Deploy**
   - Push changes to trigger a deployment
   - Monitor the build logs for any issues

## Post-Deployment Checklist

- [ ] Verify the site loads correctly
- [ ] Test authentication (sign up/sign in)
- [ ] Test AI chat functionality
- [ ] Verify database connectivity
- [ ] Check all API endpoints work
- [ ] Set up domain customizations (if needed)

## Key Features Configured

✅ **Turborepo Monorepo Support** - Vercel configuration for monorepo structure
✅ **Prisma ORM** - Database client generation and migrations
✅ **Clerk Authentication** - User auth middleware configured
✅ **Environment Variables** - All required env vars documented
✅ **API Routes** - Serverless API endpoints configured
✅ **Database Migrations** - Prisma migration system ready

## Troubleshooting

### Build Issues
- Ensure all environment variables are set
- Check that the DATABASE_URL is valid
- Verify Prisma schema is correct

### Runtime Issues
- Check Vercel function logs
- Verify database connection
- Ensure API keys are correct

### Database Issues
- Run migrations manually if needed
- Check database URL format
- Verify database permissions

## Production Considerations

1. **Monitoring** - Set up Vercel Analytics and error monitoring
2. **Backups** - Ensure regular database backups
3. **Security** - Review environment variable access
4. **Performance** - Consider Vercel Accelerate for database queries
5. **Scaling** - Configure proper resource limits

## Support

For deployment issues:
- Check Vercel deployment logs
- Review this guide's troubleshooting section
- Ensure all prerequisites are met