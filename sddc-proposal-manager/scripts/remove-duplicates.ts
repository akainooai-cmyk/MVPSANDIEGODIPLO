/**
 * Script pour supprimer les doublons et les entrées invalides
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

function isValidName(name: string): boolean {
  // Vérifier si le nom contient principalement des underscores
  const underscoreCount = (name.match(/_/g) || []).length;
  if (underscoreCount > 5) return false;

  // Vérifier si le nom est trop court
  if (name.replace(/[_\s-]/g, '').length < 3) return false;

  return true;
}

async function removeDuplicatesAndInvalid() {
  console.log('NETTOYAGE DES DOUBLONS ET ENTREES INVALIDES');
  console.log('='.repeat(80));
  console.log();

  // Récupérer toutes les ressources (paginate to get all records)
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
    console.log(`  Chargé ${allResources.length} ressources...`);

    if (data.length < pageSize) break;
    page++;
  }

  console.log();

  console.log(`Total ressources: ${allResources.length}`);
  console.log();

  const toDelete: string[] = [];
  const urlMap = new Map<string, any>();
  const nameMap = new Map<string, any>();
  let invalidCount = 0;

  // Parcourir toutes les ressources
  for (const resource of allResources) {
    const normalizedUrl = resource.url ? normalizeText(resource.url) : null;
    const normalizedName = normalizeText(resource.name);

    // Vérifier si le nom est invalide
    if (!isValidName(resource.name)) {
      console.log(`Invalide: ${resource.name}`);
      toDelete.push(resource.id);
      invalidCount++;
      continue;
    }

    // Vérifier doublon par URL
    if (normalizedUrl && urlMap.has(normalizedUrl)) {
      // C'est un doublon, on garde le premier (ancien)
      toDelete.push(resource.id);
      continue;
    }

    // Vérifier doublon par nom + catégorie (même org, même catégorie)
    const nameKey = `${normalizedName}-${resource.category}`;
    if (nameMap.has(nameKey)) {
      // C'est un doublon, on garde le premier
      toDelete.push(resource.id);
      continue;
    }

    // Garder cette ressource
    if (normalizedUrl) {
      urlMap.set(normalizedUrl, resource);
    }
    nameMap.set(nameKey, resource);
  }

  console.log(`Entrees invalides: ${invalidCount}`);
  console.log(`Doublons a supprimer: ${toDelete.length - invalidCount}`);
  console.log(`Total a supprimer: ${toDelete.length}`);
  console.log(`A conserver: ${allResources.length - toDelete.length}`);
  console.log();

  if (toDelete.length === 0) {
    console.log('Aucune suppression necessaire');
    return;
  }

  // Supprimer par lots
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
      process.stdout.write(`  Supprimees: ${deleteCount}/${toDelete.length}\r`);
    }
  }

  console.log();
  console.log();
  console.log('='.repeat(80));
  console.log('NETTOYAGE TERMINE');
  console.log('='.repeat(80));
  console.log(`Supprimees: ${deleteCount} ressources`);
  console.log(`Conservees: ${allResources.length - deleteCount} ressources`);
  console.log();

  // Vérifier le résultat
  const { count: finalCount } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  console.log(`Verification: ${finalCount} ressources dans la base`);
  console.log();
}

async function main() {
  console.log();
  console.log('='.repeat(80));
  console.log('NETTOYAGE COMPLET DE LA BASE DE DONNEES');
  console.log('='.repeat(80));
  console.log();

  await removeDuplicatesAndInvalid();

  console.log('TERMINE !');
  console.log();
}

main();
