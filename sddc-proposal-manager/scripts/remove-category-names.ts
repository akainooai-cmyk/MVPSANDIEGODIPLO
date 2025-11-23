/**
 * Supprime les ressources dont le nom est une catégorie/section et pas un vrai nom d'organisation
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeCategoryNames() {
  console.log('================================================================================');
  console.log('SUPPRESSION DES NOMS DE CATEGORIES');
  console.log('================================================================================');
  console.log();

  // Récupérer toutes les ressources
  let allResources: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Erreur:', error);
      return;
    }

    if (!data || data.length === 0) break;
    allResources = allResources.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Total ressources: ${allResources.length}`);
  console.log();

  // Noms de catégories/sections à supprimer (nom exact ou pattern)
  const categoryNames = [
    // Noms généraux d'activités
    /^Cultural Activities?$/i,
    /^Community Activities?$/i,
    /^Community Resources?$/i,
    /^Community Service Activities?$/i,
    /^Educational Activities?$/i,
    /^Social Activities?$/i,
    /^Youth Activities?$/i,
    /^Environmental Activities?$/i,

    // Noms génériques trop vagues
    /^Private Sector$/i,
    /^Public Sector$/i,
    /^Civil Society$/i,
    /^Media$/i,
    /^Arts$/i,
    /^Culture$/i,
    /^Education$/i,
    /^Environment$/i,
    /^Healthcare$/i,
    /^Technology$/i,

    // Phrases génériques
    /^Notable$/i,
    /^Additional Resources?$/i,
    /^Other Organizations?$/i,
    /^Related Organizations?$/i,
    /^Key Partners?$/i,
    /^Important Notes?$/i,
  ];

  const toDelete: string[] = [];

  console.log('DETECTION:');
  console.log('-'.repeat(80));

  allResources.forEach(r => {
    const isCategory = categoryNames.some(pattern => pattern.test(r.name.trim()));
    if (isCategory) {
      console.log(`  - "${r.name}" -> ${r.url}`);
      toDelete.push(r.id);
    }
  });

  console.log();
  console.log(`Noms de categories detectes: ${toDelete.length}`);
  console.log();

  // Supprimer aussi les "Balboa Park" qui ne pointent PAS vers balboapark.org
  console.log('VERIFICATION BALBOA PARK:');
  console.log('-'.repeat(80));

  const balboacParks = allResources.filter(r => r.name.trim() === 'Balboa Park');
  balboacParks.forEach(r => {
    if (!r.url.includes('balboapark.org')) {
      console.log(`  - "Balboa Park" -> ${r.url} (PAS le vrai Balboa Park!)`);
      if (!toDelete.includes(r.id)) {
        toDelete.push(r.id);
      }
    }
  });

  console.log();
  console.log(`Total a supprimer: ${toDelete.length}`);
  console.log(`Ressources restantes: ${allResources.length - toDelete.length}`);
  console.log();

  if (toDelete.length === 0) {
    console.log('Aucune suppression necessaire');
    return;
  }

  // Suppression
  console.log('Suppression en cours...');
  const batchSize = 100;
  let deleteCount = 0;

  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`Erreur:`, deleteError);
    } else {
      deleteCount += batch.length;
      process.stdout.write(`  Supprimees: ${deleteCount}/${toDelete.length}\\r`);
    }
  }

  console.log();
  console.log();
  console.log('================================================================================');
  console.log('TERMINE');
  console.log('================================================================================');
  console.log(`Supprimees: ${deleteCount} ressources`);

  // Vérification finale
  const { count: finalCount } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  console.log(`Verification: ${finalCount} ressources dans la base`);
  console.log();
}

removeCategoryNames();
