/**
 * Nettoyage approfondi de la base de données
 * - Supprime les noms génériques
 * - Supprime TOUS les doublons
 * - Supprime les incohérences nom/URL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deepClean() {
  console.log('================================================================================');
  console.log('NETTOYAGE APPROFONDI DE LA BASE DE DONNEES');
  console.log('================================================================================');
  console.log();

  // Récupérer toutes les ressources
  let allResources: any[] = [];
  let page = 0;
  const pageSize = 1000;

  console.log('Chargement des ressources...');
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

  console.log(`Total ressources chargees: ${allResources.length}`);
  console.log();

  const toDelete: string[] = [];

  // 1. Supprimer les noms génériques
  console.log('1. DETECTION NOMS GENERIQUES');
  console.log('-'.repeat(80));

  const genericPatterns = [
    /^Academic Institutions?$/i,
    /^Academic Resources?:?$/i,
    /^Government Agencies?$/i,
    /^Cultural Institutions?$/i,
    /^Non-?Profit Organizations?$/i,
    /^Nonprofit Organizations?$/i,
    /^Non-?Governmental Organizations?:?$/i,
    /^Non -Profit and Non-Governmental Organizations$/i,
    /^Community Organizations?$/i,
    /^Research Institutions?$/i,
    /^Schools and Academic Resource$/i,
    /^Non-Profit Organizations and Community Resources$/i,
    /^Non-Profit and Non-Governmental Organizations$/i,
  ];

  const genericResources = allResources.filter(r => {
    return genericPatterns.some(pattern => pattern.test(r.name.trim()));
  });

  console.log(`Ressources avec noms generiques: ${genericResources.length}`);
  genericResources.forEach(r => {
    console.log(`  - ${r.name} -> ${r.url}`);
    toDelete.push(r.id);
  });
  console.log();

  // 2. Supprimer les doublons stricts (même URL)
  console.log('2. DETECTION DOUBLONS PAR URL');
  console.log('-'.repeat(80));

  const urlMap = new Map<string, any[]>();
  allResources.forEach(r => {
    const normalizedUrl = r.url.toLowerCase().trim();
    if (!urlMap.has(normalizedUrl)) {
      urlMap.set(normalizedUrl, []);
    }
    urlMap.get(normalizedUrl)!.push(r);
  });

  const duplicateUrls = Array.from(urlMap.entries()).filter(([_, resources]) => resources.length > 1);
  let duplicateCount = 0;

  duplicateUrls.forEach(([url, resources]) => {
    // Garder le premier, supprimer les autres
    for (let i = 1; i < resources.length; i++) {
      if (!toDelete.includes(resources[i].id)) {
        toDelete.push(resources[i].id);
        duplicateCount++;
      }
    }
  });

  console.log(`URLs dupliquees: ${duplicateUrls.length}`);
  console.log(`Doublons a supprimer: ${duplicateCount}`);
  console.log();

  // 3. Supprimer les incohérences nom/URL
  console.log('3. DETECTION INCOHERENCES NOM/URL');
  console.log('-'.repeat(80));

  const incoherences = [
    {
      name: /Alliance San Diego/i,
      url: /alliancesandiego\.org/,
      reason: 'Alliance San Diego devrait pointer vers alliancesandiego.org'
    },
    {
      name: /American Civil Liberties Union.*ACLU/i,
      url: /aclu/,
      reason: 'ACLU devrait pointer vers un site aclu'
    },
    {
      name: /^Balboa Park$/i,
      url: /balboapark\.org|friendshippark|point.lajolla/,
      reason: 'Balboa Park devrait être le parc principal uniquement'
    }
  ];

  let incoherenceCount = 0;
  allResources.forEach(r => {
    if (toDelete.includes(r.id)) return; // Déjà marqué pour suppression

    incoherences.forEach(check => {
      if (check.name.test(r.name) && !check.url.test(r.url)) {
        console.log(`  - ${r.name} -> ${r.url}`);
        console.log(`    Raison: ${check.reason}`);
        if (!toDelete.includes(r.id)) {
          toDelete.push(r.id);
          incoherenceCount++;
        }
      }
    });
  });

  console.log(`Incoherences detectees: ${incoherenceCount}`);
  console.log();

  // 4. Supprimer les noms vides ou invalides
  console.log('4. DETECTION NOMS INVALIDES');
  console.log('-'.repeat(80));

  const invalidResources = allResources.filter(r => {
    const name = r.name.trim();
    // Nom trop court (moins de 3 caractères hors espaces/underscores)
    if (name.replace(/[_\s-]/g, '').length < 3) return true;
    // Nom composé uniquement de caractères spéciaux
    if (/^[_\s.-]+$/.test(name)) return true;
    // Nom commençant par "Government Agencies" suivi d'autre chose sur plusieurs lignes
    if (/^Government Agencies\s+\n/i.test(name)) return true;
    return false;
  });

  invalidResources.forEach(r => {
    if (!toDelete.includes(r.id)) {
      console.log(`  - "${r.name}" -> ${r.url}`);
      toDelete.push(r.id);
    }
  });

  console.log(`Noms invalides: ${invalidResources.length}`);
  console.log();

  // Résumé
  console.log('================================================================================');
  console.log('RESUME DU NETTOYAGE');
  console.log('================================================================================');
  console.log(`Total ressources: ${allResources.length}`);
  console.log(`Noms generiques: ${genericResources.length}`);
  console.log(`Doublons URL: ${duplicateCount}`);
  console.log(`Incoherences nom/URL: ${incoherenceCount}`);
  console.log(`Noms invalides: ${invalidResources.length}`);
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
      console.error(`Erreur lot ${Math.floor(i / batchSize) + 1}:`, deleteError);
    } else {
      deleteCount += batch.length;
      process.stdout.write(`  Supprimees: ${deleteCount}/${toDelete.length}\\r`);
    }
  }

  console.log();
  console.log();
  console.log('================================================================================');
  console.log('NETTOYAGE TERMINE');
  console.log('================================================================================');
  console.log(`Supprimees: ${deleteCount} ressources`);
  console.log(`Conservees: ${allResources.length - deleteCount} ressources`);
  console.log();

  // Vérification finale
  const { count: finalCount } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  console.log(`Verification: ${finalCount} ressources dans la base`);
  console.log();
}

async function main() {
  await deepClean();
  console.log('TERMINE !');
  console.log();
}

main();
