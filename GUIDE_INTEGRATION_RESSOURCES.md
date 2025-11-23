# Guide d'Intégration des Ressources IVLP

Ce guide explique comment intégrer les 126 propositions IVLP analysées dans le site IVLP Proposal Manager.

---

## Option 1 : Intégration dans la Table Ressources Existante (RECOMMANDÉ)

### Étape 1 : Préparation de la Base de Données

Les propositions IVLP sont différentes des ressources actuelles (governmental, academic, nonprofit, cultural). Vous avez deux approches :

#### Approche A : Utiliser les catégories existantes
Les propositions IVLP seront mappées vers les catégories existantes basées sur leurs thèmes :
- **governmental** : Propositions sur la sécurité, politique internationale
- **academic** : Propositions sur l'éducation, technologie
- **nonprofit** : Propositions sur les droits humains, démocratie
- **cultural** : Propositions sur les arts et la culture

#### Approche B : Ajouter une nouvelle catégorie (Nécessite modification du schéma)
Ajouter 'ivlp_proposal' comme nouvelle catégorie.

**Modification requise dans `lib/types.ts` :**
```typescript
export type ResourceCategory = 'governmental' | 'academic' | 'nonprofit' | 'cultural' | 'ivlp_proposal';
```

**Modification requise dans Supabase :**
```sql
-- Mettre à jour l'enum si nécessaire
ALTER TYPE resource_category ADD VALUE IF NOT EXISTS 'ivlp_proposal';

-- Ou si vous utilisez une contrainte CHECK
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_category_check;
ALTER TABLE resources ADD CONSTRAINT resources_category_check
  CHECK (category IN ('governmental', 'academic', 'nonprofit', 'cultural', 'ivlp_proposal'));
```

### Étape 2 : Configuration des Variables d'Environnement

Créer un fichier `.env.local` à la racine du projet :

```bash
# URL de votre instance Supabase
SUPABASE_URL=https://votre-projet.supabase.co

# Clé de service Supabase (avec droits admin)
# ATTENTION: Ne jamais commiter cette clé!
SUPABASE_SERVICE_KEY=votre_service_key_ici

# ID de l'utilisateur admin pour l'import
ADMIN_USER_ID=votre_user_id_admin

# Importer uniquement les propositions actives (FY2025-2026)
IMPORT_ACTIVE_ONLY=true  # ou false pour tout importer
```

### Étape 3 : Installation des Dépendances

```bash
npm install @supabase/supabase-js
npm install --save-dev @types/node tsx
```

### Étape 4 : Exécution de l'Import

```bash
# Import avec TypeScript directement
npx tsx import_ivlp_proposals.ts

# Ou compiler puis exécuter
npx tsc import_ivlp_proposals.ts
node import_ivlp_proposals.js
```

### Étape 5 : Vérification

Après l'import, vérifiez dans l'interface web :
1. Allez sur la page `/resources`
2. Vérifiez que les propositions IVLP apparaissent
3. Testez les filtres par catégorie
4. Vérifiez que les détails des propositions s'affichent correctement

---

## Option 2 : Créer une Table Séparée pour les Propositions IVLP

Si vous préférez séparer complètement les propositions IVLP des ressources existantes :

### Étape 1 : Créer une Nouvelle Table Supabase

```sql
CREATE TYPE ivlp_status AS ENUM ('upcoming', 'current', 'archived');

CREATE TABLE ivlp_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ivlp_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  fiscal_year TEXT NOT NULL,
  status ivlp_status NOT NULL,
  priority INTEGER NOT NULL,
  themes TEXT[] NOT NULL DEFAULT '{}',
  regions TEXT[] NOT NULL DEFAULT '{}',
  file_path TEXT,
  filename TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_ivlp_proposals_fiscal_year ON ivlp_proposals(fiscal_year);
CREATE INDEX idx_ivlp_proposals_status ON ivlp_proposals(status);
CREATE INDEX idx_ivlp_proposals_is_active ON ivlp_proposals(is_active);
CREATE INDEX idx_ivlp_proposals_themes ON ivlp_proposals USING GIN(themes);
CREATE INDEX idx_ivlp_proposals_regions ON ivlp_proposals USING GIN(regions);

-- RLS (Row Level Security)
ALTER TABLE ivlp_proposals ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read IVLP proposals"
ON ivlp_proposals FOR SELECT
TO authenticated
USING (true);

-- Politique : Écriture pour les admins uniquement
CREATE POLICY "Allow admins to manage IVLP proposals"
ON ivlp_proposals FOR ALL
TO authenticated
USING (auth.uid() IN (
  SELECT id FROM auth.users WHERE email LIKE '%@admin.com'
));
```

### Étape 2 : Créer les Types TypeScript

Ajouter dans `lib/types.ts` :

```typescript
export type IVLPStatus = 'upcoming' | 'current' | 'archived';

export interface IVLPProposal {
  id: string;
  ivlp_id: string;
  title: string;
  description: string | null;
  fiscal_year: string;
  status: IVLPStatus;
  priority: number;
  themes: string[];
  regions: string[];
  file_path: string | null;
  filename: string | null;
  is_active: boolean;
  metadata: Record<string, any> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIVLPProposalInput {
  ivlp_id: string;
  title: string;
  description?: string;
  fiscal_year: string;
  status: IVLPStatus;
  priority: number;
  themes: string[];
  regions: string[];
  file_path?: string;
  filename?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}
```

### Étape 3 : Créer l'API Route

Créer `app/api/ivlp-proposals/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fiscalYear = searchParams.get('fiscal_year');
    const status = searchParams.get('status');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabase
      .from('ivlp_proposals')
      .select('*')
      .order('priority', { ascending: false })
      .order('title', { ascending: true });

    if (fiscalYear) {
      query = query.eq('fiscal_year', fiscalYear);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: proposals, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: proposals });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Étape 4 : Créer la Page d'Interface

Créer `app/(dashboard)/ivlp-proposals/page.tsx` :

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { IVLPProposal } from '@/lib/types';

export default function IVLPProposalsPage() {
  const [proposals, setProposals] = useState<IVLPProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'current' | 'archived'>('all');

  useEffect(() => {
    fetchProposals();
  }, [filterStatus]);

  const fetchProposals = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/ivlp-proposals?${params}`);
      const data = await response.json();

      if (data.data) {
        setProposals(data.data);
      }
    } catch (error) {
      console.error('Error fetching IVLP proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'default'; // Vert
      case 'current':
        return 'secondary'; // Bleu
      case 'archived':
        return 'outline'; // Gris
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'À VENIR';
      case 'current':
        return 'ACTUEL';
      case 'archived':
        return 'ARCHIVÉ';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Propositions IVLP</h1>
          <p className="text-gray-500 mt-1">
            Base de données des propositions IVLP (FY2023-2026)
          </p>
        </div>
      </div>

      {/* Filtres de statut */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          Toutes ({proposals.length})
        </Button>
        <Button
          variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('upcoming')}
        >
          À venir
        </Button>
        <Button
          variant={filterStatus === 'current' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('current')}
        >
          Actuelles
        </Button>
        <Button
          variant={filterStatus === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('archived')}
        >
          Archivées
        </Button>
      </div>

      {/* Liste des propositions */}
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusBadgeVariant(proposal.status)}>
                      {getStatusLabel(proposal.status)}
                    </Badge>
                    <Badge variant="outline">{proposal.fiscal_year}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{proposal.title}</h3>
                  {proposal.description && (
                    <p className="text-gray-600 text-sm mb-3">{proposal.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {proposal.themes.slice(0, 3).map((theme, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {proposal.regions.slice(0, 3).map((region, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Étape 5 : Script d'Import pour Table Séparée

Créer `import_ivlp_to_separate_table.ts` :

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IVLPResource {
  id: string;
  title: string;
  description: string;
  fiscal_year: string;
  status: 'upcoming' | 'current' | 'archived';
  priority: number;
  themes: string[];
  regions: string[];
  file_path: string;
  filename: string;
  is_active: boolean;
  metadata: any;
}

async function importToSeparateTable() {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'database_resources.json'), 'utf-8')
  );

  const adminUserId = process.env.ADMIN_USER_ID || 'admin-import';
  const proposals = data.resources.map((r: IVLPResource) => ({
    ivlp_id: r.id,
    title: r.title,
    description: r.description,
    fiscal_year: r.fiscal_year,
    status: r.status,
    priority: r.priority,
    themes: r.themes,
    regions: r.regions,
    file_path: r.file_path,
    filename: r.filename,
    is_active: r.is_active,
    metadata: r.metadata,
    created_by: adminUserId,
  }));

  console.log(`📥 Import de ${proposals.length} propositions IVLP...`);

  const batchSize = 10;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < proposals.length; i += batchSize) {
    const batch = proposals.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('ivlp_proposals')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Erreur:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += data?.length || 0;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} importé`);
    }
  }

  console.log(`\n✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
}

importToSeparateTable();
```

---

## Recommandations

### Pour un Déploiement Rapide
**Utilisez l'Option 1 (Intégration dans la table existante)** car :
- Pas de modification de schéma nécessaire
- Réutilise l'interface existante
- Plus simple à mettre en place

### Pour une Solution Long Terme
**Utilisez l'Option 2 (Table séparée)** car :
- Sépare clairement les propositions IVLP des autres ressources
- Permet des champs spécifiques aux propositions IVLP
- Meilleure organisation des données
- Interface dédiée plus adaptée

---

## Support et Dépannage

### Problèmes Courants

**1. Erreur "table resources does not exist"**
- Vérifiez que votre base de données Supabase est correctement configurée
- Vérifiez que la table `resources` existe

**2. Erreur "SUPABASE_URL is not defined"**
- Assurez-vous que le fichier `.env.local` existe
- Vérifiez que les variables sont correctement définies

**3. Import échoue avec "Unauthorized"**
- Vérifiez que SUPABASE_SERVICE_KEY est correct
- Vérifiez que l'utilisateur admin existe

**4. Certaines propositions ne s'importent pas**
- Vérifiez les logs pour voir les erreurs spécifiques
- Vérifiez les contraintes de votre base de données

---

## Prochaines Étapes

Après l'import réussi :

1. **Tester l'interface web** - Vérifier que les propositions s'affichent correctement
2. **Ajouter des filtres avancés** - Par thème, région, année fiscale
3. **Implémenter la recherche** - Recherche full-text dans les titres
4. **Ajouter le téléchargement de fichiers** - Permettre le téléchargement des .docx
5. **Créer des rapports** - Statistiques et analyses des propositions

---

**Date de création:** 23 novembre 2025
**Auteur:** Claude AI
**Version:** 1.0
