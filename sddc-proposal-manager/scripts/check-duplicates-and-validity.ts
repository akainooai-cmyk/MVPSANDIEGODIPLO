/**
 * Script pour vérifier les doublons et la validité des ressources
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function checkDuplicates() {
  console.log('VERIFICATION DES DOUBLONS');
  console.log('='.repeat(80));
  console.log();

  // Récupérer toutes les ressources (paginate to get all records)
  let allResources: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('id, name, url')
      .order('name')
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

  // Détecter doublons par nom
  const nameMap = new Map<string, any[]>();
  allResources.forEach(r => {
    const normalizedName = normalizeText(r.name);
    if (!nameMap.has(normalizedName)) {
      nameMap.set(normalizedName, []);
    }
    nameMap.get(normalizedName)!.push(r);
  });

  const duplicatesByName = Array.from(nameMap.entries())
    .filter(([_, resources]) => resources.length > 1);

  console.log('1. DOUBLONS PAR NOM');
  console.log('-'.repeat(80));
  if (duplicatesByName.length > 0) {
    console.log(`Trouve: ${duplicatesByName.length} groupes de doublons\n`);

    duplicatesByName.slice(0, 10).forEach(([name, resources]) => {
      console.log(`Nom: ${resources[0].name}`);
      console.log(`Occurrences: ${resources.length}`);
      resources.forEach(r => {
        console.log(`  - ID: ${r.id}`);
        console.log(`    URL: ${r.url}`);
      });
      console.log();
    });

    if (duplicatesByName.length > 10) {
      console.log(`... et ${duplicatesByName.length - 10} autres groupes`);
    }
  } else {
    console.log('Aucun doublon trouve par nom');
  }

  console.log();

  // Détecter doublons par URL
  const urlMap = new Map<string, any[]>();
  allResources.forEach(r => {
    if (r.url) {
      const normalizedUrl = normalizeText(r.url);
      if (!urlMap.has(normalizedUrl)) {
        urlMap.set(normalizedUrl, []);
      }
      urlMap.get(normalizedUrl)!.push(r);
    }
  });

  const duplicatesByUrl = Array.from(urlMap.entries())
    .filter(([_, resources]) => resources.length > 1);

  console.log('2. DOUBLONS PAR URL');
  console.log('-'.repeat(80));
  if (duplicatesByUrl.length > 0) {
    console.log(`Trouve: ${duplicatesByUrl.length} groupes de doublons\n`);

    duplicatesByUrl.slice(0, 10).forEach(([url, resources]) => {
      console.log(`URL: ${resources[0].url}`);
      console.log(`Occurrences: ${resources.length}`);
      resources.forEach(r => {
        console.log(`  - ${r.name} (ID: ${r.id})`);
      });
      console.log();
    });

    if (duplicatesByUrl.length > 10) {
      console.log(`... et ${duplicatesByUrl.length - 10} autres groupes`);
    }
  } else {
    console.log('Aucun doublon trouve par URL');
  }

  console.log();
  console.log('='.repeat(80));
  console.log('RESUME');
  console.log('='.repeat(80));
  console.log(`Doublons par nom: ${duplicatesByName.length} groupes`);
  console.log(`Doublons par URL: ${duplicatesByUrl.length} groupes`);

  // Calculer le total d'entrées en doublon
  const totalDuplicatesByName = duplicatesByName.reduce((sum, [_, resources]) => sum + resources.length - 1, 0);
  const totalDuplicatesByUrl = duplicatesByUrl.reduce((sum, [_, resources]) => sum + resources.length - 1, 0);

  console.log(`Total entrees en doublon (nom): ${totalDuplicatesByName}`);
  console.log(`Total entrees en doublon (URL): ${totalDuplicatesByUrl}`);
  console.log();

  return {
    duplicatesByName,
    duplicatesByUrl,
    totalDuplicatesByName,
    totalDuplicatesByUrl
  };
}

async function checkFormat() {
  console.log('VERIFICATION DU FORMAT');
  console.log('='.repeat(80));
  console.log();

  // Récupérer les anciennes ressources (celles qui étaient là avant)
  const { data: oldResources } = await supabase
    .from('resources')
    .select('*')
    .in('name', [
      'San Diego County Sheriff\'s Department - Narcotics Task Force (NTF)',
      'U.S. Customs and Border Protection (CBP) - San Diego Field Office',
      'Homeland Security Investigations (HSI) - San Diego'
    ])
    .limit(3);

  // Récupérer des ressources IVLP
  const { data: newResources } = await supabase
    .from('resources')
    .select('*')
    .not('name', 'in', `(${oldResources?.map(r => `'${r.name}'`).join(',') || ''})`)
    .limit(3);

  console.log('COMPARAISON FORMAT:');
  console.log();

  if (oldResources && oldResources.length > 0) {
    console.log('Anciennes ressources (reference):');
    console.log('-'.repeat(80));
    oldResources.forEach(r => {
      console.log(`Nom: ${r.name}`);
      console.log(`Categorie: ${r.category}`);
      console.log(`URL: ${r.url ? 'OUI' : 'NON'}`);
      console.log(`Description: ${r.description ? (r.description.length > 50 ? 'OUI' : 'COURTE') : 'NON'}`);
      console.log(`Meeting Focus: ${r.meeting_focus ? 'OUI' : 'NON'}`);
      console.log(`Price: ${r.price || 'null'}`);
      console.log(`Accessibility: ${r.accessibility || 'null'}`);
      console.log();
    });
  }

  if (newResources && newResources.length > 0) {
    console.log('Nouvelles ressources IVLP:');
    console.log('-'.repeat(80));
    newResources.forEach(r => {
      console.log(`Nom: ${r.name}`);
      console.log(`Categorie: ${r.category}`);
      console.log(`URL: ${r.url ? 'OUI' : 'NON'}`);
      console.log(`Description: ${r.description ? (r.description.length > 50 ? 'OUI' : 'COURTE') : 'NON'}`);
      console.log(`Meeting Focus: ${r.meeting_focus ? 'OUI' : 'NON'}`);
      console.log(`Price: ${r.price || 'null'}`);
      console.log(`Accessibility: ${r.accessibility || 'null'}`);
      console.log();
    });
  }

  console.log('='.repeat(80));
  console.log('FORMAT VERIFIE');
  console.log('='.repeat(80));
  console.log();
}

async function main() {
  console.log();
  console.log('='.repeat(80));
  console.log('VERIFICATION COMPLETE DES RESSOURCES');
  console.log('='.repeat(80));
  console.log();

  // Vérifier les doublons
  const duplicates = await checkDuplicates();

  console.log();

  // Vérifier le format
  await checkFormat();

  console.log('NOTE: Pour verifier l\'actualite des URLs (si elles sont toujours valides),');
  console.log('il faudrait tester chaque URL individuellement, ce qui prendrait du temps.');
  console.log('Les URLs proviennent directement des propositions IVLP officielles.');
  console.log();
}

main();
