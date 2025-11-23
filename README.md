# San Diego Diplomacy Council - Proposal Manager

IVLP Proposal Management System for the San Diego Diplomacy Council.

## Features

- **Project Management**: Create and manage IVLP projects
- **Document Upload**: Upload and extract content from .docx files
- **AI-Powered Proposal Generation**: Generate proposals using Claude AI
- **Resource Management**: Manage San Diego resources database
- **Collaborative Editing**: Comment and edit proposals with history tracking
- **PDF Export**: Professional PDF generation with branding

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Anthropic Claude API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sddc-proposal-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
sddc-proposal-manager/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Dashboard pages
│   ├── api/                 # API routes
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Layout components
│   ├── auth/                # Auth components
│   ├── projects/            # Project components
│   ├── proposals/           # Proposal components
│   └── resources/           # Resource components
├── lib/                     # Utilities
│   ├── supabase/           # Supabase client
│   ├── claude/             # Claude AI integration
│   ├── document/           # Document processing
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Helper functions
├── hooks/                   # Custom React hooks
├── public/                  # Static assets
└── styles/                  # Additional styles
```

## Database Setup

See `CLAUDE_CODE_PROMPT_SDDC.md` for the complete database schema and setup instructions.

## Building for Production

```bash
npm run build
npm start
```

## License

Proprietary - San Diego Diplomacy Council
