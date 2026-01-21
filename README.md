# Yoga & Fitness Video Platform

A modern video platform for yoga, mobility, and calisthenics content with premium access control.

## Tech Stack

- [Astro](https://astro.build/) v5 - Modern web framework with SSR
- [React](https://react.dev/) v19 - UI library for interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible UI components
- [Supabase](https://supabase.com/) - Backend with PostgreSQL, Auth & Storage

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd yoga-video-platform
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

📖 **See [ENV_SETUP.md](./ENV_SETUP.md) for detailed instructions on getting these values.**

Get these values from your Supabase project settings at https://app.supabase.com

4. Set up the database:

```bash
# Run migrations (if using Supabase CLI)
npx supabase db push
```

5. Run the development server:

```bash
npm run dev
```

The app will be available at http://localhost:3000

6. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Project Structure

```
.
├── src/
│   ├── layouts/           # Astro layouts
│   ├── pages/             # Astro pages
│   │   └── api/           # API endpoints
│   ├── components/        # UI components (Astro & React)
│   │   └── ui/            # Shadcn/ui components
│   ├── lib/
│   │   ├── hooks/         # React custom hooks
│   │   ├── services/      # Business logic services
│   │   ├── utils/         # Utility functions
│   │   ├── validators/    # Zod schemas
│   │   └── types/         # View model types
│   ├── db/                # Supabase client & types
│   ├── middleware/        # Astro middleware
│   ├── styles/            # Global styles
│   └── types.ts           # Shared types (DTOs)
├── public/                # Public assets
└── supabase/
    ├── migrations/        # Database migrations
    └── config.toml        # Supabase config
```

## Features

- 🎥 **Video Management**: Browse and filter yoga, mobility, and calisthenics videos
- 🔐 **Authentication**: Magic link authentication via Supabase
- 💎 **Premium Content**: Role-based access control (Free, Premium, Admin)
- 🎨 **Modern UI**: Beautiful, responsive design with Shadcn/ui components
- ⚡ **Performance**: SSR with Astro, client-side hydration for interactivity
- ♿ **Accessible**: WCAG compliant with keyboard navigation
- 📱 **Responsive**: Mobile-first design that works on all devices

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
