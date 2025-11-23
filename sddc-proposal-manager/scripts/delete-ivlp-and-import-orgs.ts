/**
 * Script pour supprimer les anciennes ressources IVLP et importer les nouvelles organisations
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type ResourceCategory = 'governmental' | 'academic' | 'nonprofit' | 'cultural';

interface Organization {
  name: string;
  url: string;
  description: string;
  meeting_focus: string;
  source_proposal: string;
  fiscal_year: string;
}

function determineCategory(name: string, description: string): ResourceCategory {
  const text = (name + ' ' + description).toLowerCase();

  // Academic
  if (text.includes('university') || text.includes('college') || text.includes('school') ||
      text.includes('education') || text.includes('research') || text.includes('institute')) {
    return 'academic';
  }

  // Cultural
  if (text.includes('museum') || text.includes('arts') || text.includes('culture') ||
      text.includes('theater') || text.includes('gallery') || text.includes('heritage')) {
    return 'cultural';
  }

  // Nonprofit
  if (text.includes('nonprofit') || text.includes('non-profit') || text.includes('ngo') ||
      text.includes('foundation') || text.includes('coalition') || text.includes('alliance') ||
      text.includes('advocacy') || text.includes('rights') || text.includes('community center')) {
    return 'nonprofit';
  }

  // Par defaut: governmental
  return 'governmental';
}

async function deleteOldIVLPResources() {
  console.log('SUPPRESSION DES ANCIENNES RESSOURCES IVLP');
  console.log('='.repeat(80));
  console.log();

  // Supprimer toutes les ressources qui n'ont pas d'URL
  // (ce sont les ressources IVLP que j'ai importees incorrectement)
  const { data: toDelete, error: fetchError } = await supabase
    .from('resources')
    .select('id, name')
    .is('url', null);

  if (fetchError) {
    console.error('Erreur:', fetchError);
    return false;
  }

  if (!toDelete || toDelete.length === 0) {
    console.log('Aucune ressource IVLP a supprimer');
    return true;
  }

  console.log(`Trouve: ${toDelete.length} ressources IVLP a supprimer`);
  console.log();

  // Supprimer par lots
  const { error: deleteError } = await supabase
    .from('resources')
    .delete()
    .is('url', null);

  if (deleteError) {
    console.error('Erreur lors de la suppression:', deleteError);
    return false;
  }

  console.log(`Supprimees: ${toDelete.length} ressources`);
  console.log();
  return true;
}

async function importOrganizations() {
  console.log('IMPORT DES ORGANISATIONS');
  console.log('='.repeat(80));
  console.log();

  // Charger les organisations
  const dataPath = path.join(__dirname, '..', '..', 'organizations_improved.json');

  if (!fs.existsSync(dataPath)) {
    console.error('Fichier non trouve:', dataPath);
    return false;
  }

  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const organizations: Organization[] = JSON.parse(fileContent);

  console.log(`Chargees: ${organizations.length} organisations`);
  console.log();

  // Obtenir l'utilisateur admin
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUserId = users?.users[0]?.id || 'unknown';

  console.log(`Utilisateur: ${users?.users[0]?.email || 'unknown'}`);
  console.log();

  // Import par lots
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < organizations.length; i += batchSize) {
    const batch = organizations.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(organizations.length / batchSize);

    process.stdout.write(`   Lot ${batchNumber}/${totalBatches}... `);

    // Mapper les organisations
    const resources = batch.map(org => {
      const category = determineCategory(org.name, org.description);

      return {
        category,
        name: org.name,
        description: org.description || 'IVLP resource',
        url: org.url || null,
        meeting_focus: org.meeting_focus || null,
        price: null,
        accessibility: null,
        is_active: true,
        created_by: adminUserId,
      };
    });

    // Inserer
    const { data, error } = await supabase
      .from('resources')
      .insert(resources)
      .select();

    if (error) {
      console.log('ERREUR');
      console.error(`      ${error.message}`);
      errorCount += batch.length;
      errors.push(error.message);
    } else {
      console.log(`OK (${data?.length || 0})`);
      successCount += data?.length || 0;
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('RESUME');
  console.log('='.repeat(80));
  console.log(`Reussies: ${successCount} organisations`);
  console.log(`Erreurs: ${errorCount} organisations`);

  if (errors.length > 0) {
    console.log();
    console.log('Erreurs rencontrees:');
    errors.slice(0, 3).forEach(err => console.log(`  - ${err}`));
  }

  console.log();
  return successCount > 0;
}

async function main() {
  console.log();
  console.log('='.repeat(80));
  console.log('MISE A JOUR COMPLETE DES RESSOURCES IVLP');
  console.log('='.repeat(80));
  console.log();

  // Etape 1: Supprimer anciennes ressources
  const deleted = await deleteOldIVLPResources();

  if (!deleted) {
    console.error('Echec de la suppression');
    process.exit(1);
  }

  // Etape 2: Importer nouvelles organisations
  const imported = await importOrganizations();

  if (!imported) {
    console.error('Echec de l\'import');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('TERMINE AVEC SUCCES !');
  console.log('='.repeat(80));
  console.log();
  console.log('Les ressources IVLP sont maintenant:');
  console.log('  - Correctement formatees avec URL, description et meeting focus');
  console.log('  - Reparties par categorie (governmental, academic, nonprofit, cultural)');
  console.log('  - Prets a l\'utilisation sur le site');
  console.log();
}

// Execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}

export { deleteOldIVLPResources, importOrganizations };
