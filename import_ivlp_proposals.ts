/**
 * Script d'import des propositions IVLP dans la base de données Supabase
 *
 * Ce script importe les propositions IVLP analysées depuis database_resources.json
 * dans la base de données Supabase pour les rendre accessibles via l'interface web.
 *
 * IMPORTANT : Avant d'exécuter ce script, vous devez :
 * 1. Étendre le type ResourceCategory dans lib/types.ts pour inclure 'ivlp_proposal'
 * 2. Mettre à jour le schéma de la base de données pour supporter cette nouvelle catégorie
 * 3. Configurer les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERREUR: Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Type pour les ressources IVLP
interface IVLPResource {
  id: string;
  title: string;
  description: string;
  type: string;
  fiscal_year: string;
  status: 'upcoming' | 'current' | 'archived';
  priority: number;
  themes: string[];
  regions: string[];
  file_path: string;
  filename: string;
  is_active: boolean;
  created_date: string;
  metadata: {
    years_mentioned: string[];
    document_type: string;
  };
}

interface DatabaseResourcesData {
  summary: any;
  resources: IVLPResource[];
  last_updated: string;
  data_source: string;
}

// Mapper les propositions IVLP vers le format de ressource existant
function mapIVLPToResource(ivlp: IVLPResource, userId: string) {
  // Déterminer la catégorie basée sur les thèmes
  let category: 'governmental' | 'academic' | 'nonprofit' | 'cultural' = 'governmental';

  if (ivlp.themes.includes('Education') || ivlp.themes.includes('Technology')) {
    category = 'academic';
  } else if (ivlp.themes.includes('Arts & Culture')) {
    category = 'cultural';
  } else if (ivlp.themes.includes('Human Rights') || ivlp.themes.includes('Democracy')) {
    category = 'nonprofit';
  }

  return {
    category,
    name: ivlp.title,
    description: `${ivlp.description}\n\nFiscal Year: ${ivlp.fiscal_year}\nStatus: ${ivlp.status.toUpperCase()}\nThemes: ${ivlp.themes.join(', ')}\nRegions: ${ivlp.regions.join(', ')}`,
    url: null, // Les propositions IVLP sont des fichiers locaux
    meeting_focus: `${ivlp.themes.join(', ')} - ${ivlp.regions.join(', ')}`,
    price: null,
    accessibility: `Document Type: ${ivlp.metadata.document_type.toUpperCase()} - Priority: ${ivlp.priority}`,
    is_active: ivlp.is_active,
    created_by: userId,
    // Métadonnées supplémentaires stockées en JSON
    metadata: {
      ivlp_id: ivlp.id,
      fiscal_year: ivlp.fiscal_year,
      status: ivlp.status,
      priority: ivlp.priority,
      themes: ivlp.themes,
      regions: ivlp.regions,
      file_path: ivlp.file_path,
      years_mentioned: ivlp.metadata.years_mentioned,
      document_type: ivlp.metadata.document_type,
    }
  };
}

async function importIVLPProposals() {
  console.log('🚀 Début de l\'import des propositions IVLP\n');

  // Lire le fichier database_resources.json
  const jsonPath = path.join(__dirname, 'database_resources.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Fichier non trouvé: ${jsonPath}`);
    process.exit(1);
  }

  const data: DatabaseResourcesData = JSON.parse(
    fs.readFileSync(jsonPath, 'utf-8')
  );

  console.log(`📊 Statistiques des propositions IVLP:`);
  console.log(`   Total: ${data.resources.length} propositions`);
  console.log(`   Actives: ${data.resources.filter(r => r.is_active).length}`);
  console.log(`   Archivées: ${data.resources.filter(r => !r.is_active).length}`);
  console.log('');

  // Obtenir l'utilisateur admin pour l'import
  // IMPORTANT: Remplacer par l'ID d'un utilisateur admin réel
  const adminUserId = process.env.ADMIN_USER_ID || 'admin-import';

  console.log(`👤 Utilisateur d'import: ${adminUserId}\n`);

  // Filtrer les propositions à importer (optionnel: seulement les actives)
  const importActiveOnly = process.env.IMPORT_ACTIVE_ONLY === 'true';
  const proposalsToImport = importActiveOnly
    ? data.resources.filter(r => r.is_active)
    : data.resources;

  console.log(`📥 Import de ${proposalsToImport.length} propositions...\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: { id: string; error: string }[] = [];

  // Import par lots de 10
  const batchSize = 10;
  for (let i = 0; i < proposalsToImport.length; i += batchSize) {
    const batch = proposalsToImport.slice(i, i + batchSize);

    console.log(`📦 Traitement du lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(proposalsToImport.length / batchSize)}...`);

    const mappedResources = batch.map(ivlp => mapIVLPToResource(ivlp, adminUserId));

    const { data: insertedData, error } = await supabase
      .from('resources')
      .insert(mappedResources)
      .select();

    if (error) {
      console.error(`   ❌ Erreur lors de l'import du lot:`, error.message);
      errorCount += batch.length;
      batch.forEach(ivlp => errors.push({ id: ivlp.id, error: error.message }));
    } else {
      successCount += insertedData?.length || 0;
      console.log(`   ✅ ${insertedData?.length || 0} propositions importées`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('='.repeat(60));
  console.log(`✅ Succès: ${successCount} propositions`);
  console.log(`❌ Erreurs: ${errorCount} propositions`);

  if (errors.length > 0) {
    console.log('\n⚠️  Détails des erreurs:');
    errors.slice(0, 10).forEach(({ id, error }) => {
      console.log(`   - ${id}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... et ${errors.length - 10} autres erreurs`);
    }
  }

  console.log('\n✨ Import terminé!\n');
}

// Point d'entrée
if (require.main === module) {
  importIVLPProposals()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { importIVLPProposals };
