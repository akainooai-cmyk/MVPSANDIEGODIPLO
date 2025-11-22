# 🏛️ PROMPT CLAUDE CODE - San Diego Diplomacy Council
## Système de Gestion des Proposals IVLP

---

## 📋 RÉSUMÉ DU PROJET

Tu vas créer une application web complète pour le **San Diego Diplomacy Council** permettant de gérer les proposals dans le cadre du programme **International Visitor Leadership Program (IVLP)**.

### Contexte Métier
Le San Diego Diplomacy Council reçoit des projets du Département d'État américain. Pour chaque projet, ils doivent produire un "Proposal" expliquant pourquoi San Diego est la destination idéale, avec des ressources locales pertinentes (gouvernementales, académiques, ONG, culturelles).

### Flux de travail
```
Documents d'entrée → Analyse IA → Génération Proposal → Validation Humaine → Export PDF
```

---

## 🎯 OBJECTIFS FONCTIONNELS

### 1. Gestion des Projets
- Créer, lister, modifier, supprimer des projets
- Chaque projet contient :
  - **Project Data** (document obligatoire)
  - **Bios & Objectives** (document OPTIONNEL)
  - **Proposal** (généré par l'IA)
- Suivi du statut : `draft` → `in_review` → `approved`

### 2. Upload de Documents
- Drag & drop pour les fichiers `.docx`
- Extraction automatique du contenu
- Stockage dans Supabase Storage

### 3. Génération IA du Proposal
- Analyse des documents uploadés
- Recherche web pour enrichir les ressources
- Consultation de la base de données des ressources San Diego
- Génération structurée selon le format officiel

### 4. Validation et Édition
- Interface d'édition du proposal
- Système de commentaires/annotations
- Chat IA contextuel pour discuter du projet
- Historique complet des modifications (qui, quand, quoi)

### 5. Export
- Génération PDF professionnel avec logo
- Téléchargement direct

### 6. Gestion des Ressources
- CRUD pour les ressources San Diego
- Catégories : Governmental, Academic, Nonprofit, Cultural
- Chaque ressource : nom, description, URL, meeting focus

---

## 🛠️ STACK TECHNIQUE

### Frontend
```
Framework: Next.js 14 (App Router)
UI: TailwindCSS + shadcn/ui
State: React Context + useState/useReducer
Forms: React Hook Form + Zod
Rich Text: TipTap ou similar
```

### Backend
```
API: Next.js API Routes (Route Handlers)
Database: Supabase (PostgreSQL)
Auth: Supabase Auth (email/password)
Storage: Supabase Storage
IA: API Claude Anthropic (claude-sonnet-4-20250514)
```

### Déploiement
```
Hosting: Vercel ou Netlify
Database: Supabase Cloud
```

---

## 🗄️ SCHÉMA DE BASE DE DONNÉES SUPABASE

```sql
-- =============================================
-- TABLES PRINCIPALES
-- =============================================

-- Profils utilisateurs (extension de auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projets
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  project_number TEXT, -- ex: E/VRF-2025-0055
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved')),
  
  -- Métadonnées extraites du Project Data
  project_title TEXT,
  project_type TEXT,
  start_date DATE,
  end_date DATE,
  estimated_participants INTEGER,
  sponsoring_agency TEXT,
  subject TEXT,
  project_description TEXT,
  project_objectives JSONB, -- Array of objectives
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents uploadés
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('project_data', 'bios_objectives')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  extracted_content TEXT, -- Contenu extrait du document
  extracted_metadata JSONB, -- Métadonnées structurées
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals générés
CREATE TABLE public.proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved')),
  
  -- Contenu structuré du proposal
  content JSONB NOT NULL,
  /* Structure de content:
  {
    "why_san_diego": "...",
    "governmental_resources": [
      {
        "id": "uuid",
        "name": "...",
        "url": "...",
        "description": "...",
        "meeting_focus": "...",
        "selected": true
      }
    ],
    "academic_resources": [...],
    "nonprofit_resources": [...],
    "cultural_activities": [...]
  }
  */
  
  -- PDF généré
  pdf_url TEXT,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historique des modifications de proposals
CREATE TABLE public.proposal_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  change_summary TEXT,
  edited_by UUID REFERENCES public.profiles(id),
  edited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commentaires sur les proposals
CREATE TABLE public.proposal_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  section TEXT, -- ex: "why_san_diego", "governmental_resources", etc.
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations IA par projet
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  /* Structure de messages:
  [
    {
      "role": "user",
      "content": "...",
      "timestamp": "..."
    },
    {
      "role": "assistant",
      "content": "...",
      "timestamp": "..."
    }
  ]
  */
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BASE DE DONNÉES DES RESSOURCES SAN DIEGO
-- =============================================

CREATE TABLE public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('governmental', 'academic', 'nonprofit', 'cultural')),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  meeting_focus TEXT, -- Objectif de la réunion proposée
  price TEXT, -- Pour les activités culturelles
  accessibility TEXT, -- Infos d'accès
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_documents_project_id ON public.documents(project_id);
CREATE INDEX idx_proposals_project_id ON public.proposals(project_id);
CREATE INDEX idx_resources_category ON public.resources(category);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Policies : tous les utilisateurs authentifiés ont accès à tout
CREATE POLICY "Authenticated users can do everything" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can do everything" ON public.projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can do everything" ON public.documents FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can do everything" ON public.proposals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can do everything" ON public.proposal_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can do everything" ON public.proposal_comments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can do everything" ON public.conversations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can do everything" ON public.resources FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- FUNCTIONS
-- =============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📁 STRUCTURE DU PROJET

```
sddc-proposal-manager/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard principal
│   │   ├── projects/
│   │   │   ├── page.tsx                # Liste des projets
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # Nouveau projet
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Détail projet
│   │   │       ├── edit/
│   │   │       │   └── page.tsx        # Édition proposal
│   │   │       └── chat/
│   │   │           └── page.tsx        # Chat IA
│   │   └── resources/
│   │       ├── page.tsx                # Liste ressources
│   │       └── new/
│   │           └── page.tsx            # Nouvelle ressource
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...supabase]/
│   │   │       └── route.ts
│   │   ├── projects/
│   │   │   ├── route.ts                # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts            # GET, PUT, DELETE
│   │   ├── documents/
│   │   │   ├── upload/
│   │   │   │   └── route.ts            # POST upload
│   │   │   └── extract/
│   │   │       └── route.ts            # POST extraction contenu
│   │   ├── proposals/
│   │   │   ├── generate/
│   │   │   │   └── route.ts            # POST génération IA
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts            # GET, PUT
│   │   │   │   └── export/
│   │   │   │       └── route.ts        # GET export PDF
│   │   │   └── history/
│   │   │       └── route.ts            # GET historique
│   │   ├── chat/
│   │   │   └── route.ts                # POST message IA
│   │   └── resources/
│   │       ├── route.ts                # GET, POST
│   │       └── [id]/
│   │           └── route.ts            # PUT, DELETE
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                             # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── projects/
│   │   ├── project-card.tsx
│   │   ├── project-list.tsx
│   │   ├── project-form.tsx
│   │   └── document-uploader.tsx
│   ├── proposals/
│   │   ├── proposal-editor.tsx
│   │   ├── proposal-preview.tsx
│   │   ├── resource-selector.tsx
│   │   ├── section-editor.tsx
│   │   └── comment-panel.tsx
│   ├── chat/
│   │   ├── chat-interface.tsx
│   │   └── message-bubble.tsx
│   └── resources/
│       ├── resource-card.tsx
│       ├── resource-list.tsx
│       └── resource-form.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Client-side Supabase
│   │   ├── server.ts                   # Server-side Supabase
│   │   └── middleware.ts
│   ├── claude/
│   │   ├── client.ts                   # Client API Claude
│   │   ├── prompts.ts                  # Prompts système
│   │   └── tools.ts                    # Outils de recherche
│   ├── document/
│   │   ├── parser.ts                   # Extraction DOCX
│   │   └── generator.ts                # Génération DOCX/PDF
│   ├── utils.ts
│   └── types.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-projects.ts
│   ├── use-proposals.ts
│   └── use-resources.ts
├── public/
│   ├── logo-sddc.jpg                   # Logo San Diego Diplomacy Council
│   └── favicon.ico
├── styles/
│   └── globals.css
├── .env.local.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🎨 DESIGN SYSTEM

### Palette de Couleurs (Gouvernemental/Professionnel)

```css
:root {
  /* Couleurs principales - inspirées du logo SDDC */
  --primary-blue: #1E3A5F;        /* Bleu marine profond */
  --primary-blue-light: #2D5A87;  /* Bleu plus clair */
  --accent-orange: #E85D04;       /* Orange du logo */
  --accent-red: #C1292E;          /* Rouge du logo */
  
  /* Neutres */
  --gray-50: #F8FAFC;
  --gray-100: #F1F5F9;
  --gray-200: #E2E8F0;
  --gray-300: #CBD5E1;
  --gray-400: #94A3B8;
  --gray-500: #64748B;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1E293B;
  --gray-900: #0F172A;
  
  /* Sémantiques */
  --success: #059669;
  --warning: #D97706;
  --error: #DC2626;
  --info: #0284C7;
  
  /* Background */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-tertiary: #F1F5F9;
}
```

### Typographie

```css
/* Police principale */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Hiérarchie */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

### Composants Clés

#### Header
```
┌─────────────────────────────────────────────────────────────────┐
│ [LOGO SDDC]  San Diego Diplomacy Council    [User] ▼  [Logout] │
└─────────────────────────────────────────────────────────────────┘
```

#### Sidebar
```
┌──────────────────┐
│ 📊 Dashboard     │
│ 📁 Projects      │
│ 📚 Resources     │
│ ⚙️  Settings     │
└──────────────────┘
```

#### Project Card
```
┌────────────────────────────────────────┐
│ E/VRF-2025-0055                   [●]  │  ← Status badge
│ U.S.-ROK Partnership: Combating...     │
│                                        │
│ 📅 Nov 24 - Dec 12, 2025              │
│ 👥 5 participants                      │
│                                        │
│ [View] [Edit Proposal] [Export PDF]    │
└────────────────────────────────────────┘
```

---

## 🤖 INTÉGRATION IA - PROMPTS SYSTÈME

### Prompt Principal - Génération de Proposal

```typescript
// lib/claude/prompts.ts

export const PROPOSAL_GENERATION_PROMPT = `
Tu es un assistant spécialisé pour le San Diego Diplomacy Council, responsable de créer des proposals professionnels pour le programme International Visitor Leadership Program (IVLP).

## CONTEXTE
Le San Diego Diplomacy Council répond à des appels à projets du Département d'État américain. Pour chaque projet, tu dois créer un proposal expliquant pourquoi San Diego est la destination idéale.

## STRUCTURE DU PROPOSAL (À RESPECTER EXACTEMENT)

1. **En-tête**
   - Project Title/Subject
   - Project Type
   - NPA: (National Program Agency)
   - Project Dates
   - Point of Contact: Lulu Bonning, Executive Director
     - (619) 289-8642
     - lulu@sandiegodiplomacy.org

2. **Why San Diego?**
   Un paragraphe convaincant expliquant pourquoi San Diego est idéale pour ce projet spécifique.
   - Mentionner la position géographique stratégique si pertinent
   - Mentionner les ressources uniques disponibles
   - Adapter au thème du projet

3. **Governmental Resources**
   Pour chaque ressource:
   - Nom de l'organisation
   - URL
   - Description (2-3 phrases)
   - *Meeting Focus:* Objectif spécifique de la réunion en lien avec le projet

4. **Academic Resources**
   Même format que Governmental

5. **Nonprofit Resources**
   Même format que Governmental

6. **Cultural Activities**
   Pour chaque activité:
   - Nom
   - URL
   - Prix
   - Description
   - Accessibility (comment s'y rendre)

## RÈGLES IMPORTANTES

1. **Pertinence**: Sélectionne UNIQUEMENT les ressources pertinentes au thème du projet
2. **Meeting Focus**: Le meeting focus doit être SPÉCIFIQUE au projet, pas générique
3. **Actualité**: Vérifie que les URLs sont valides et les informations à jour
4. **Ton professionnel**: Style formel, diplomatique, gouvernemental
5. **Personnalisation**: Adapte le "Why San Diego?" au thème spécifique du projet

## FORMAT DE SORTIE

Réponds en JSON avec la structure suivante:
{
  "why_san_diego": "...",
  "governmental_resources": [
    {
      "name": "...",
      "url": "...",
      "description": "...",
      "meeting_focus": "..."
    }
  ],
  "academic_resources": [...],
  "nonprofit_resources": [...],
  "cultural_activities": [
    {
      "name": "...",
      "url": "...",
      "price": "...",
      "description": "...",
      "accessibility": "..."
    }
  ]
}
`;

export const CHAT_SYSTEM_PROMPT = `
Tu es un assistant IA pour le San Diego Diplomacy Council. Tu aides les utilisateurs à:
1. Améliorer leurs proposals IVLP
2. Trouver des ressources pertinentes à San Diego
3. Reformuler des sections
4. Répondre aux questions sur le processus

Tu as accès à:
- Les détails du projet en cours
- L'historique de tous les projets
- La base de données des ressources San Diego

Sois professionnel, précis et utile. Si tu ne sais pas, dis-le.
`;
```

### Fonction d'Appel à l'API Claude

```typescript
// lib/claude/client.ts

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateProposal(
  projectData: ProjectData,
  biosObjectives: BiosObjectives | null,
  resources: Resource[]
): Promise<ProposalContent> {
  
  const userPrompt = `
## PROJET À ANALYSER

### Project Data
${JSON.stringify(projectData, null, 2)}

${biosObjectives ? `### Bios & Objectives
${JSON.stringify(biosObjectives, null, 2)}` : ''}

### Ressources San Diego Disponibles
${JSON.stringify(resources, null, 2)}

---

Génère un proposal complet et pertinent pour ce projet.
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: PROPOSAL_GENERATION_PROMPT,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  });

  // Parser la réponse JSON
  const content = response.content[0];
  if (content.type === 'text') {
    return JSON.parse(content.text);
  }
  
  throw new Error('Invalid response from Claude');
}

export async function chatWithAssistant(
  messages: Message[],
  projectContext: ProjectContext
): Promise<string> {
  
  const systemPrompt = `${CHAT_SYSTEM_PROMPT}

## CONTEXTE DU PROJET ACTUEL
${JSON.stringify(projectContext, null, 2)}
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  
  throw new Error('Invalid response from Claude');
}
```

---

## 📄 GÉNÉRATION DE DOCUMENTS

### Génération DOCX (Proposal)

```typescript
// lib/document/generator.ts

import {
  Document, Packer, Paragraph, TextRun, ImageRun,
  AlignmentType, HeadingLevel, ExternalHyperlink,
  Header, Footer, PageNumber
} from 'docx';
import * as fs from 'fs';

export async function generateProposalDocx(
  proposal: ProposalContent,
  projectData: ProjectData,
  logoPath: string
): Promise<Buffer> {
  
  const logoBuffer = fs.readFileSync(logoPath);
  
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 24 } // 12pt
        }
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          run: { size: 32, bold: true, color: '1E3A5F', font: 'Arial' },
          paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER }
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          run: { size: 28, bold: true, color: '1E3A5F', font: 'Arial' },
          paragraph: { spacing: { before: 360, after: 120 } }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          run: { size: 24, bold: true, color: '1E3A5F', font: 'Arial' },
          paragraph: { spacing: { before: 240, after: 80 } }
        }
      ]
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  type: 'jpg',
                  data: logoBuffer,
                  transformation: { width: 400, height: 120 },
                  altText: {
                    title: 'San Diego Diplomacy Council',
                    description: 'Logo',
                    name: 'SDDC Logo'
                  }
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun('Page '),
                new TextRun({ children: [PageNumber.CURRENT] }),
                new TextRun(' of '),
                new TextRun({ children: [PageNumber.TOTAL_PAGES] })
              ]
            })
          ]
        })
      },
      children: [
        // En-tête du projet
        new Paragraph({
          children: [
            new TextRun({ text: 'Project Title/Subject: ', bold: true }),
            new TextRun(projectData.project_title || '')
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Project Type: ', bold: true }),
            new TextRun(projectData.project_type || '')
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'NPA: ', bold: true }),
            new TextRun('San Diego Diplomacy Council')
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Project Dates: ', bold: true }),
            new TextRun(`${projectData.start_date} - ${projectData.end_date}`)
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Point of Contact: ', bold: true }),
            new TextRun('Lulu Bonning, Executive Director')
          ]
        }),
        new Paragraph({
          children: [new TextRun('(619) 289-8642')]
        }),
        new Paragraph({
          children: [new TextRun('lulu@sandiegodiplomacy.org')]
        }),
        
        // Why San Diego?
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Why San Diego?')]
        }),
        new Paragraph({
          children: [new TextRun(proposal.why_san_diego)]
        }),
        
        // Governmental Resources
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Governmental Resources')]
        }),
        ...generateResourceParagraphs(proposal.governmental_resources),
        
        // Academic Resources
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Academic Resources')]
        }),
        ...generateResourceParagraphs(proposal.academic_resources),
        
        // Nonprofit Resources
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Nonprofit Resources')]
        }),
        ...generateResourceParagraphs(proposal.nonprofit_resources),
        
        // Cultural Activities
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Cultural Activities')]
        }),
        ...generateCulturalParagraphs(proposal.cultural_activities)
      ]
    }]
  });
  
  return await Packer.toBuffer(doc);
}

function generateResourceParagraphs(resources: Resource[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  for (const resource of resources) {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(resource.name)]
      }),
      new Paragraph({
        children: [
          new ExternalHyperlink({
            children: [new TextRun({ text: resource.url, style: 'Hyperlink' })],
            link: resource.url
          })
        ]
      }),
      new Paragraph({
        children: [new TextRun(resource.description)]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Meeting Focus: ', bold: true, italics: true }),
          new TextRun({ text: resource.meeting_focus, italics: true })
        ]
      })
    );
  }
  
  return paragraphs;
}

function generateCulturalParagraphs(activities: CulturalActivity[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  for (const activity of activities) {
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(activity.name)]
      }),
      new Paragraph({
        children: [
          new ExternalHyperlink({
            children: [new TextRun({ text: activity.url, style: 'Hyperlink' })],
            link: activity.url
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Price: ', bold: true }),
          new TextRun(activity.price)
        ]
      }),
      new Paragraph({
        children: [new TextRun(activity.description)]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Accessibility: ', bold: true }),
          new TextRun(activity.accessibility)
        ]
      })
    );
  }
  
  return paragraphs;
}
```

### Conversion DOCX vers PDF

```typescript
// lib/document/generator.ts (suite)

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function convertDocxToPdf(docxPath: string, outputPath: string): Promise<void> {
  // Utiliser LibreOffice en mode headless
  await execAsync(`soffice --headless --convert-to pdf --outdir ${path.dirname(outputPath)} ${docxPath}`);
}
```

---

## 🔐 AUTHENTIFICATION

### Configuration Supabase Auth

```typescript
// lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component
          }
        },
      },
    }
  );
}
```

### Middleware d'Authentification

```typescript
// middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Rediriger vers login si non authentifié
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Rediriger vers dashboard si déjà authentifié
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

## 📦 DONNÉES INITIALES (SEED)

### Ressources San Diego Pré-configurées

```typescript
// scripts/seed-resources.ts

const INITIAL_RESOURCES = [
  // GOVERNMENTAL
  {
    category: 'governmental',
    name: 'San Diego County Sheriff\'s Department - Narcotics Task Force (NTF)',
    url: 'https://www.sdsheriff.gov/',
    description: 'NTF is a multi-agency enforcement unit disrupting drug trafficking organizations (DTOs). It includes partnerships with DEA, CBP, and international agencies, focusing on fentanyl seizures, criminal networks, and cross-border surveillance.',
    meeting_focus: 'Understand how law enforcement agencies collaborate to detect, intercept, and dismantle synthetic opioid trafficking operations.'
  },
  {
    category: 'governmental',
    name: 'U.S. Customs and Border Protection (CBP) - San Diego Field Office',
    url: 'https://www.cbp.gov/contact/ports/san-diego',
    description: 'CBP manages interdiction at key San Diego border crossings, where most fentanyl enters the U.S. The San Diego Field Office uses detection technologies and coordinates with foreign enforcement partners.',
    meeting_focus: 'Learn how CBP identifies and intercepts synthetic drugs at ports of entry and how international collaboration helps block fentanyl supply chains.'
  },
  {
    category: 'governmental',
    name: 'Homeland Security Investigations (HSI) - San Diego',
    url: 'https://www.ice.gov/node/65589',
    description: 'HSI leads transnational investigations targeting fentanyl production and trafficking, cyber marketplaces, and chemical precursors. San Diego is a critical hub in HSI\'s international cooperation programs.',
    meeting_focus: 'Examine HSI\'s strategies for dismantling synthetic drug networks and partnering with foreign agencies.'
  },
  {
    category: 'governmental',
    name: 'San Diego County - Health & Human Services Agency (HHSA), Behavioral Health Services',
    url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/bhs.html',
    description: 'HHSA leads the region\'s opioid response, tracking overdose data, distributing naloxone, and coordinating prevention and treatment services. They also lead the San Diego Opioid Task Force.',
    meeting_focus: 'Explore how regional public health agencies track and respond to synthetic drug overdoses using integrated prevention and treatment approaches.'
  },
  
  // ACADEMIC
  {
    category: 'academic',
    name: 'SDSU Institute for Public Health - Center for Alcohol & Drug Studies and Services (CADSS)',
    url: 'https://socialwork.sdsu.edu/research/center-for-aod',
    description: 'Located within SDSU\'s School of Public Health, CADSS conducts research, evaluation, and training in substance use prevention, treatment, and harm reduction. It partners with county departments and community-based organizations to address the opioid crisis.',
    meeting_focus: 'Explore how research centers support local fentanyl mitigation efforts through data-driven prevention, evaluation of harm reduction programs, and partnerships with government and nonprofit agencies.'
  },
  
  // NONPROFIT
  {
    category: 'nonprofit',
    name: 'McAlister Institute - Addiction Recovery & Community Outreach',
    url: 'https://www.mcalisterinc.org/',
    description: 'McAlister Institute runs outpatient, residential, and detox programs focused on opioid recovery. It supports justice-involved individuals and works closely with the courts, offering alternative sentencing and relapse prevention.',
    meeting_focus: 'Understand how nonprofits bridge the gap between justice systems and public health to provide addiction recovery solutions for fentanyl-impacted populations.'
  },
  {
    category: 'nonprofit',
    name: 'SAY San Diego - Youth & Prevention Programs',
    url: 'https://www.saysandiego.org',
    description: 'SAY San Diego provides school and community prevention services focused on substance use. Their programming includes peer mentoring, parental education, and policy advocacy for youth protection.',
    meeting_focus: 'Learn how early prevention programs engage schools, families, and communities to reduce youth exposure to synthetic opioids.'
  },
  
  // CULTURAL
  {
    category: 'cultural',
    name: 'San Diego Zoo',
    url: 'https://www.sandiegozoo.org/',
    description: 'The 100-acre Zoo is home to over 3,700 rare and endangered animals representing more than 650 species and subspecies, and a prominent botanical collection with more than 700,000 exotic plants.',
    price: '$62 for one Adult Ticket',
    accessibility: 'The zoo is located just north of downtown San Diego in Balboa Park (a 5-10-minute drive from downtown).'
  },
  {
    category: 'cultural',
    name: 'Harbor Cruise',
    url: 'https://www.sdhe.com/',
    description: 'Narrated tours covering ships of the Maritime Museum, Harbor and Shelter Islands, North Island Naval Air Station, the Submarine Base, the Coronado Bridge, and more.',
    price: '$30 for one-hour tour; $35 for full bay two-hour tour',
    accessibility: 'The tour begins and ends at the same location downtown along Broadway Pier.'
  },
  {
    category: 'cultural',
    name: 'USS Midway Museum',
    url: 'https://www.midway.org/',
    description: 'Experience life at sea aboard one of America\'s longest-serving aircraft carriers. Explore more than 60 exhibits with a collection of 30 restored aircraft. Self-guided audio tour narrated by Midway sailors.',
    price: '$26 for one Adult General Admission Ticket',
    accessibility: 'The museum is located downtown alongside Navy Pier. Operating Hours: 10am - 5pm.'
  },
  {
    category: 'cultural',
    name: 'Balboa Park',
    url: 'https://www.balboapark.org/',
    description: 'Home to 17 major museums and cultural institutions, renowned performing arts venues, beautiful gardens and the San Diego Zoo. Ever-changing calendar of museum exhibitions, plays, musicals, concerts, and classes.',
    price: 'Free (individual attractions may have fees)',
    accessibility: 'Conveniently located just north of downtown San Diego (a 5-10-minute drive from downtown).'
  },
  {
    category: 'cultural',
    name: 'Old Town Trolley Tour',
    url: 'https://www.trolleytours.com/san-diego',
    description: 'Hop-on hop-off sightseeing tours highlighting the best San Diego attractions. 25-mile loop visiting 10 neighborhoods with 10 destination stops including the San Diego-Coronado Bridge.',
    price: '$44 for a 1-Day Adult Ticket',
    accessibility: 'Hours of operation: 8:50am - 5:00pm. Multiple stops throughout San Diego.'
  },
  {
    category: 'cultural',
    name: 'Coronado',
    url: 'https://coronadovisitorcenter.com/',
    description: 'Charming oceanfront community with beaches consistently voted among America\'s finest. Features fine homes, mansions, and the historic Hotel del Coronado.',
    price: 'Free',
    accessibility: 'Accessible via Coronado Bridge, Coronado Ferry, or water taxi. 15-20 minute drive from downtown.'
  },
  {
    category: 'cultural',
    name: 'SeaWorld San Diego',
    url: 'https://www.seaworldparks.com/en/seaworld-sandiego',
    description: 'Experience the Orca Encounter, Dolphin Days, and Sea Lions Live shows. Thrilling rides like Electric Eel, Manta, and Journey To Atlantis. Feed dolphins and get up-close to beluga whales, polar bears, sharks and penguins.',
    price: '$99.99 for one Adult Ticket',
    accessibility: '15-20 minute drive from downtown San Diego.'
  }
];
```

---

## 🖥️ COMPOSANTS UI CLÉS

### Page de Login

```tsx
// app/(auth)/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-sddc.jpg"
              alt="San Diego Diplomacy Council"
              width={200}
              height={60}
              priority
            />
          </div>
          <CardTitle className="text-2xl text-primary-blue">Welcome</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Dashboard Principal

```tsx
// app/(dashboard)/page.tsx

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, FolderOpen, CheckCircle, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  
  // Stats
  const { count: totalProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });
    
  const { count: draftProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft');
    
  const { count: approvedProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  // Recent projects
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Draft</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftProjects || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedProjects || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Resources</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <Link href="/resources" className="text-2xl font-bold text-blue-600 hover:underline">
              Manage →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects && recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{project.project_title || project.name}</h3>
                    <p className="text-sm text-gray-500">{project.project_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'approved' ? 'bg-green-100 text-green-700' :
                      project.status === 'in_review' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status}
                    </span>
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No projects yet. <Link href="/projects/new" className="text-blue-600 hover:underline">Create your first project</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints

```css
/* Tailwind defaults utilisés */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Layout Adaptatif

```tsx
// Sidebar se transforme en menu hamburger sur mobile
// Cards passent de grid à stack sur mobile
// Tableaux deviennent des cards sur mobile
```

---

## 🔧 VARIABLES D'ENVIRONNEMENT

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 INSTRUCTIONS DE DÉPLOIEMENT

### 1. Supabase Setup
```bash
# Créer les tables via le SQL Editor de Supabase
# Copier le schéma SQL fourni ci-dessus
# Activer RLS sur toutes les tables
# Configurer le Storage bucket 'documents'
```

### 2. Vercel/Netlify Setup
```bash
# Variables d'environnement à configurer :
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - ANTHROPIC_API_KEY
```

### 3. Commandes de développement
```bash
npm install
npm run dev
```

---

## ✅ CHECKLIST MVP

### Phase 1 - Foundation
- [ ] Setup Next.js 14 avec App Router
- [ ] Configuration Supabase (auth, database, storage)
- [ ] Configuration Tailwind + shadcn/ui
- [ ] Layout de base (header, sidebar, footer)
- [ ] Pages auth (login, register)
- [ ] Middleware d'authentification

### Phase 2 - Core Features
- [ ] CRUD Projets
- [ ] Upload documents (drag & drop)
- [ ] Extraction contenu DOCX
- [ ] Base de données ressources (seed + CRUD)
- [ ] Interface gestion ressources

### Phase 3 - IA Integration
- [ ] Intégration API Claude
- [ ] Génération proposal
- [ ] Chat IA contextuel
- [ ] Recherche web pour enrichissement

### Phase 4 - Editing & Validation
- [ ] Éditeur de proposal
- [ ] Sélection/désélection ressources
- [ ] Système de commentaires
- [ ] Historique des modifications

### Phase 5 - Export & Polish
- [ ] Génération DOCX
- [ ] Conversion PDF
- [ ] Notifications interface
- [ ] Tests et corrections
- [ ] Déploiement

---

## 📝 NOTES IMPORTANTES

1. **Logo**: Le fichier `logo-sddc.jpg` doit être placé dans `/public/`

2. **Extraction DOCX**: Utiliser la librairie `mammoth` pour extraire le texte des documents uploadés

3. **Recherche Web**: L'IA peut utiliser des outils de recherche pour vérifier/enrichir les informations

4. **Historique**: Chaque modification de proposal doit créer une entrée dans `proposal_history`

5. **Performance**: Utiliser des Server Components par défaut, Client Components uniquement quand nécessaire

6. **Sécurité**: Toutes les API routes doivent vérifier l'authentification

---

**FIN DU PROMPT CLAUDE CODE**
