# TypeScript Configuration Package

This package contains shared TypeScript configurations for the AnswerPoint monorepo.

## Available Configurations

- `base.json` - Base configuration with strict settings
- `node.json` - Node.js/Express applications
- `react.json` - React applications
- `nextjs.json` - Next.js applications

## Usage

### For Node.js/Express Apps
```json
{
  "extends": "@answerpoint/typescript-config/node.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### For React Apps
```json
{
  "extends": "@answerpoint/typescript-config/react.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### For Next.js Apps
```json
{
  "extends": "@answerpoint/typescript-config/nextjs.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Installation

This package is automatically available within the monorepo workspace.
