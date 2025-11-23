/**
 * Script d'import des propositions IVLP nettoyées dans Supabase
 *
 * Ce script importe 125 propositions IVLP (après suppression des doublons)
 * dans la table resources de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration Supabase
const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Types
type ResourceCategory = 'governmental' | 'academic' | 'nonprofit' | 'cultural';

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

/**
 * Détermine la catégorie basée sur les thèmes de la proposition
 */
function determineCategory(themes: string[]): ResourceCategory {
  // Ordre de priorité pour la classification
  if (themes.includes('Education') || themes.includes('Technology')) {
    return 'academic';
  }
  if (themes.includes('Arts & Culture')) {
    return 'cultural';
  }
  if (themes.includes('Human Rights') || themes.includes('Democracy')) {
    return 'nonprofit';
  }
  // Par défaut: governmental (Security, Health, Economy, Climate, etc.)
  return 'governmental';
}

/**
 * Mapper une proposition IVLP vers le format de la table resources
 */
function mapToResource(ivlp: IVLPResource, userId: string) {
  const category = determineCategory(ivlp.themes);

  // Créer une description enrichie (sans emojis)
  const enrichedDescription = `${ivlp.description}

Annee Fiscale: ${ivlp.fiscal_year}
Statut: ${ivlp.status.toUpperCase()}
Themes: ${ivlp.themes.join(', ')}
Regions: ${ivlp.regions.join(', ')}
Priorite: ${ivlp.priority}/4`;

  return {
    category,
    name: ivlp.title,
    description: enrichedDescription,
    url: null, // Les propositions IVLP sont des fichiers locaux
    meeting_focus: `${ivlp.themes.slice(0, 3).join(', ')} - ${ivlp.regions.slice(0, 2).join(', ')}`,
    price: ivlp.fiscal_year, // Utiliser ce champ pour stocker l'année fiscale
    accessibility: `${ivlp.status.toUpperCase()} - Priority ${ivlp.priority}`,
    is_active: ivlp.is_active,
    created_by: userId,
  };
}

async function getOrCreateAdminUser() {
  // Essayer de trouver un utilisateur admin existant
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }

  if (users && users.users.length > 0) {
    console.log(`✅ Utilisation de l'utilisateur: ${users.users[0].email}`);
    return users.users[0].id;
  }

  throw new Error('Aucun utilisateur trouvé. Veuillez créer un compte admin dans Supabase.');
}

async function importIVLPResources() {
  console.log('🚀 IMPORT DES PROPOSITIONS IVLP DANS SUPABASE');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1. Charger les données nettoyées
    const dataPath = path.join(__dirname, '..', '..', 'database_resources_cleaned.json');
    console.log(`📂 Chargement des données depuis: ${dataPath}`);

    if (!fs.existsSync(dataPath)) {
      throw new Error(`Fichier non trouvé: ${dataPath}`);
    }

    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const resources: IVLPResource[] = data.resources;

    console.log(`✅ ${resources.length} propositions chargées`);
    console.log(`   - Actives (FY2025-2026): ${resources.filter(r => r.is_active).length}`);
    console.log(`   - Archivées (FY2023-2024): ${resources.filter(r => !r.is_active).length}`);
    console.log();

    // 2. Obtenir un utilisateur admin
    console.log('👤 Récupération de l\'utilisateur admin...');
    const adminUserId = await getOrCreateAdminUser();
    console.log();

    // 3. Demander confirmation
    console.log('⚠️  ATTENTION: Ceci va importer les ressources dans la base de données');
    console.log(`   Base de données: ${supabaseUrl}`);
    console.log(`   Nombre de ressources: ${resources.length}`);
    console.log();

    // 4. Import par lots
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ title: string; error: string }> = [];

    console.log(`📥 Import en cours (par lots de ${batchSize})...`);
    console.log();

    for (let i = 0; i < resources.length; i += batchSize) {
      const batch = resources.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(resources.length / batchSize);

      process.stdout.write(`   Lot ${batchNumber}/${totalBatches}... `);

      // Mapper les ressources
      const mappedResources = batch.map(ivlp => mapToResource(ivlp, adminUserId));

      // Insérer dans Supabase
      const { data: insertedData, error } = await supabase
        .from('resources')
        .insert(mappedResources)
        .select();

      if (error) {
        console.log('❌ ERREUR');
        console.error(`      Détails: ${error.message}`);
        errorCount += batch.length;
        batch.forEach(ivlp => errors.push({ title: ivlp.title, error: error.message }));
      } else {
        console.log(`✅ ${insertedData?.length || 0} importées`);
        successCount += insertedData?.length || 0;
      }
    }

    // 5. Résumé
    console.log();
    console.log('='.repeat(80));
    console.log('📊 RÉSUMÉ DE L\'IMPORT');
    console.log('='.repeat(80));
    console.log(`✅ Succès: ${successCount} propositions`);
    console.log(`❌ Erreurs: ${errorCount} propositions`);

    if (successCount > 0) {
      const successRate = ((successCount / resources.length) * 100).toFixed(1);
      console.log(`📈 Taux de réussite: ${successRate}%`);
    }

    if (errors.length > 0) {
      console.log();
      console.log('⚠️  Détails des erreurs (10 premières):');
      errors.slice(0, 10).forEach(({ title, error }) => {
        console.log(`   - ${title.substring(0, 50)}...`);
        console.log(`     Erreur: ${error}`);
      });

      if (errors.length > 10) {
        console.log(`   ... et ${errors.length - 10} autres erreurs`);
      }
    }

    console.log();

    if (successCount > 0) {
      console.log('✨ Import terminé avec succès !');
      console.log(`🌐 Vérifiez sur: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/editor`);
    } else {
      console.log('❌ L\'import a échoué. Vérifiez les erreurs ci-dessus.');
    }

    console.log();

  } catch (error: any) {
    console.error();
    console.error('❌ ERREUR FATALE:', error.message);
    console.error();
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  importIVLPResources()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { importIVLPResources };
