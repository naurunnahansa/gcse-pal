# AnswerPoint

**AI-Powered Multi-Tenant Customer Service Platform**

AnswerPoint is a universal customer service agent platform built on the Model Context Protocol (MCP). It provides intelligent AI agents that seamlessly handle customer inquiries across four universal domains: Public (pre-sales), Product (features), Customer (accounts), and Operational (internal support).

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** 8.15.0+
- **PostgreSQL** 14+
- **Neo4j** (for knowledge base and vector search)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Set up databases
pnpm db:generate
pnpm db:push

# Start development servers
pnpm dev
```

This will start:
- **Platform (Next.js)**: http://localhost:3000
- **xMCP Server**: MCP application

## 📁 Project Structure

```
answerpoint/
├── apps/
│   ├── platform/            # Next.js 15 AI chatbot platform
│   └── xmcp/                # xMCP application with tool syntax
├── packages/
│   ├── db/                  # Drizzle ORM + PostgreSQL schema
│   ├── knowledge/           # Neo4j integration for vector search
│   └── typescript-config/   # Shared TypeScript configurations
├── docs/
│   ├── architecture.md      # Complete system architecture
│   ├── launch.md           # MVP launch checklist
│   └── architecture.excalidraw
└── README.md               # This file
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.5** with App Router
- **React 19** with Server Components
- **WorkOS AuthKit** for enterprise authentication
- **Vercel AI SDK** for chat interface
- **Tailwind CSS 4** + Radix UI

### Backend
- **Express.js** with TypeScript
- **Model Context Protocol (MCP)** server
- **Drizzle ORM** with PostgreSQL
- **Neo4j** for knowledge graphs and vector search
- **Zod** for validation

### Databases
- **PostgreSQL**: Structured data (14 tables)
- **Neo4j**: Unstructured knowledge with vector embeddings

## 🎯 Key Features

### Universal 4-Domain Framework
- **Public Domain**: Pre-sales support (accessible to anyone)
- **Product Domain**: Product/feature support (prospects + customers)
- **Customer Domain**: Account management (authenticated users)
- **Operational Domain**: Internal tools (staff only)

### Multi-Tenant Architecture
- WorkOS integration for enterprise SSO
- Organization management with role-based access
- Secure tenant isolation across all data

### Model Context Protocol (MCP)
- Extensible AI agent tools via MCP
- Built-in MCP server with multi-tenant support
- Current tools: company info, customer data, calculations, and more

### Advanced Capabilities
- Hybrid database strategy (PostgreSQL + Neo4j)
- Semantic search with vector embeddings
- Complex product & pricing management
- CRM integration ready (Salesforce, HubSpot, Stripe)
- Persistent conversations per platform

## 📜 Available Scripts

### Development

```bash
pnpm dev              # Start all apps in development mode
pnpm build            # Build all apps for production
pnpm check-types      # Run TypeScript type checking
pnpm lint             # Run ESLint
pnpm clean            # Clean build artifacts
```

### Database Management

```bash
pnpm db:generate      # Generate database migrations
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio for database management
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

Create `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/answerpoint_db

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# WorkOS Authentication
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_COOKIE_PASSWORD=32-character-secure-password
WORKOS_REDIRECT_URI=http://localhost:3000/callback

# OpenAI
OPENAI_API_KEY=sk-...

# API Configuration
PORT=8001
NODE_ENV=development
API_VERSION=1.0.0
CORS_ORIGIN=http://localhost:3000
```

## 🏗️ Architecture Overview

AnswerPoint uses a **hybrid database architecture**:

- **PostgreSQL**: Transactional data (products, pricing, users, customers, conversations)
- **Neo4j**: Knowledge documents with vector embeddings for semantic search

### Key Components

1. **MCP Client (Frontend)**: Universal customer service agent consuming MCP servers
2. **MCP Server (Backend)**: Multi-tenant server exposing tools, resources, and prompts
3. **Data Layer**: Hybrid PostgreSQL + Neo4j for structured + unstructured data
4. **Authentication**: WorkOS for enterprise SSO and organization management

### Database Schema

**PostgreSQL Tables (14):**
- `tenants`, `users`, `organization_memberships`, `organization_invitations`
- `products`, `product_variants`, `pricing_plans`, `pricing_tiers`
- `customers`, `customer_segments`, `customer_segment_membership`
- `conversations`, `messages`, `agent_configs`

**Neo4j Nodes:**
- `Document`: Knowledge documents with domain classification
- `Chunk`: Searchable text segments with 1536-dim embeddings

## 🔌 MCP Server Integration

### Available MCP Tools

- `get_company_info` - Retrieve tenant information
- `get_customers` - Fetch customer list
- `calculator` - Evaluate mathematical expressions
- `echo` - Test tool for debugging

### Connecting to MCP Server

```typescript
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:8001/mcp')
);
```

### MCP Resources

- `answerpoint://api/status` - API health information
- `answerpoint://api/config` - Configuration settings
- `answerpoint://docs/endpoints` - API documentation

## 📚 Documentation

For detailed documentation, see the `docs/` folder:

- **[architecture.md](docs/architecture.md)**: Complete system architecture, database schemas, and design decisions
- **[launch.md](docs/launch.md)**: MVP launch checklist and roadmap
- **[architecture.excalidraw](docs/architecture.excalidraw)**: Visual architecture diagram

## 🔐 Authentication & Authorization

AnswerPoint uses **WorkOS AuthKit** for enterprise-grade authentication:

- Google OAuth integration
- Multi-tenant organization management
- Role-based access control (Admin, Member, Viewer)
- Secure session management with middleware

### Authentication Flow

1. User visits sign-in page
2. Authenticates via Google OAuth through WorkOS
3. WorkOS creates/associates user with organization
4. User lands on dashboard with tenant context

## 🚦 API Endpoints

### REST API

```
POST /auth/sso/initiate              # Organization-based SSO
POST /auth/sso/provider              # Provider-based SSO (Google)
POST /auth/callback                  # SSO callback
GET  /auth/me                        # Current user info
POST /auth/logout                    # Sign out

POST /api/organizations              # Create organization
GET  /api/organizations              # List user's organizations
GET  /api/organizations/:id/members  # Get org members
POST /api/organizations/:id/invite   # Invite users
POST /api/invitations/:id/accept     # Accept invitation

POST /mcp                            # MCP protocol endpoint
```

### Frontend Routes

```
/                          # Home (redirects based on auth)
/sign-in                   # Sign-in page
/sign-up                   # Sign-up page
/dashboard                 # Main dashboard (protected)
/create-organization       # Organization creation
/callback                  # OAuth callback handler
```

## 🧪 Testing

```bash
# Run type checking
pnpm check-types

# Run linting
pnpm lint

# Test chat functionality
# Visit http://localhost:3000/dashboard and try:
# - "5 + 3 / 4" (calculator tool)
# - "Tell me about this company" (company info tool)
```

## 📦 Deployment

### Production Build

```bash
# Build all apps
pnpm build

# Start production servers
cd apps/api && pnpm start
cd apps/client && pnpm start
```

### Environment Setup

1. Set up PostgreSQL database
2. Set up Neo4j instance
3. Configure WorkOS project
4. Set production environment variables
5. Run database migrations
6. Deploy frontend to Vercel (recommended)
7. Deploy backend to your preferred hosting

## 🤝 Contributing

This is an active development project. Key areas of focus:

- Multi-tenant MCP server implementation
- Industry-specific templates (E-commerce, SaaS, Professional Services)
- Advanced CRM integrations
- Analytics and reporting
- Enterprise features

## 📄 License

[Add your license here]

## 🔗 Links

- [WorkOS Documentation](https://workos.com/docs)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Neo4j Documentation](https://neo4j.com/docs/)

---

**Built with MCP** • Multi-Tenant • AI-Powered • Enterprise-Ready
