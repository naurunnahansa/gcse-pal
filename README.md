# GCSE Pal

**AI-Powered Educational Platform**

GCSE Pal is an educational platform built on the Model Context Protocol (MCP), providing intelligent AI assistance powered by Claude.

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** 8.15.0+

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Start development servers
pnpm dev
```

This will start:
- **Platform (Next.js)**: http://localhost:3000
- **xMCP Server**: MCP application

## 📁 Project Structure

```
gcse-pal/
├── apps/
│   ├── platform/            # Next.js AI chatbot platform
│   └── xmcp/                # xMCP application with tool syntax
├── packages/
│   ├── db/                  # Drizzle ORM + PostgreSQL schema
│   ├── knowledge/           # Neo4j integration for vector search
│   └── typescript-config/   # Shared TypeScript configurations
└── README.md               # This file
```

## 🛠️ Technology Stack

### Platform
- **Next.js 16** with App Router
- **React 19** with Server Components
- **Vercel AI SDK** for chat interface
- **Tailwind CSS 4** + Radix UI
- **Claude Sonnet 4.5** via Anthropic API

### Backend
- **xMCP** - Model Context Protocol server
- **Drizzle ORM** with PostgreSQL (optional)
- **Neo4j** for knowledge graphs (optional)
- **Zod** for validation

## 📜 Available Scripts

### Development

```bash
pnpm dev              # Start all apps in development mode
pnpm build            # Build all apps for production
pnpm check-types      # Run TypeScript type checking
pnpm lint             # Run ESLint
pnpm clean            # Clean build artifacts
```

### Individual Apps

```bash
# Platform (Next.js)
cd apps/platform
pnpm dev              # Start on port 3000
pnpm build            # Build for production

# xMCP Application
cd apps/xmcp
pnpm dev              # Start in dev mode
pnpm build            # Build for production
pnpm start            # Start production server
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Anthropic API Key (Required)
ANTHROPIC_API_KEY=sk-ant-...

# xMCP Server URL (Optional - defaults to http://localhost:3001/mcp)
MCP_SERVER_URL=http://localhost:3001/mcp

# Database URL (Optional - only if using packages/db)
# DATABASE_URL=postgresql://username:password@localhost:5432/database
```

You can also copy the example file:
```bash
cp .env.example .env
```

## 🏗️ Architecture Overview

GCSE Pal uses a modern monorepo architecture powered by Turborepo and pnpm workspaces:

### Key Components

1. **Platform (Frontend)**: Next.js AI chatbot interface with Claude Sonnet 4.5
2. **xMCP Server**: MCP server exposing tools, resources, and prompts
3. **Shared Packages**: Reusable TypeScript configurations and utilities

### Model Context Protocol (MCP)

The platform connects to the xMCP server to access additional tools and capabilities:

- **Tools**: Custom functions the AI can execute
- **Resources**: Data and content the AI can access
- **Prompts**: Template definitions for AI interactions

## 🔌 MCP Server Integration

### Connecting to MCP Server

```typescript
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:3001/mcp')
);
```

## 📦 Deployment

### Production Build

```bash
# Build all apps
pnpm build

# Start production servers
cd apps/xmcp && pnpm start
cd apps/platform && pnpm start
```

### Deployment Options

- Deploy platform to **Vercel** (recommended for Next.js)
- Deploy xMCP server to your preferred hosting
- Set production environment variables

## 🤝 Contributing

This is an active development project. Feel free to submit issues and pull requests.

## 📄 License

[Add your license here]

## 🔗 Links

- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Anthropic Claude](https://www.anthropic.com/claude)
- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo](https://turbo.build/repo)
- [xMCP](https://xmcp.dev/)

---

**Built with MCP** • **Powered by Claude** • **Built with Turborepo**
