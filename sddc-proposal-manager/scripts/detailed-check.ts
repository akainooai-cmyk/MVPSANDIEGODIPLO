import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://biiguoetdgqmcsoozvnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA'
);

async function detailedCheck() {
  console.log('================================================================================');
  console.log('VERIFICATION DETAILLEE DES RESSOURCES');
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

  console.log(`Total ressources chargees: ${allResources.length}`);
  console.log();

  // 1. Vérifier meeting_focus
  console.log('1. VERIFICATION MEETING FOCUS');
  console.log('-'.repeat(80));

  const withoutMeetingFocus = allResources.filter(r => !r.meeting_focus || r.meeting_focus.trim() === '');
  const withMeetingFocus = allResources.filter(r => r.meeting_focus && r.meeting_focus.trim() !== '');

  console.log(`Avec meeting_focus: ${withMeetingFocus.length} (${Math.round(withMeetingFocus.length / allResources.length * 100)}%)`);
  console.log(`Sans meeting_focus: ${withoutMeetingFocus.length} (${Math.round(withoutMeetingFocus.length / allResources.length * 100)}%)`);
  console.log();

  if (withoutMeetingFocus.length > 0) {
    console.log('EXEMPLES SANS MEETING FOCUS:');
    withoutMeetingFocus.slice(0, 10).forEach((r, i) => {
      console.log(`${i + 1}. ${r.name}`);
      console.log(`   URL: ${r.url}`);
      console.log(`   Description: ${r.description?.substring(0, 80)}...`);
      console.log();
    });
  }

  // 2. Vérifier les noms génériques
  console.log();
  console.log('2. VERIFICATION NOMS GENERIQUES');
  console.log('-'.repeat(80));

  const genericNames = [
    'Academic Institutions',
    'Academic Institution',
    'Academic Resource',
    'Academic Resources',
    'Academic Resources:',
    'Community Organizations',
    'Cultural Institutions',
    'Government Agencies',
    'Non-Governmental Organizations',
    'Non-Profit Organizations',
    'Nonprofit Organizations',
    'Research Institutions'
  ];

  const resourcesWithGenericNames = allResources.filter(r =>
    genericNames.some(gn => r.name.toLowerCase().includes(gn.toLowerCase()))
  );

  console.log(`Ressources avec noms generiques: ${resourcesWithGenericNames.length}`);
  console.log();

  if (resourcesWithGenericNames.length > 0) {
    console.log('EXEMPLES:');
    resourcesWithGenericNames.slice(0, 15).forEach((r, i) => {
      console.log(`${i + 1}. "${r.name}"`);
      console.log(`   URL: ${r.url}`);
      console.log();
    });
  }

  // 3. Vérifier les noms qui ne correspondent pas aux URLs
  console.log();
  console.log('3. VERIFICATION COHERENCE NOM/URL');
  console.log('-'.repeat(80));

  const potentialMismatches: any[] = [];

  // Exemples spécifiques détectés
  const specificChecks = [
    { name: 'Alliance San Diego', expectedUrl: 'alliancesandiego.org' },
    { name: 'American Civil Liberties Union (ACLU)', expectedUrl: 'aclu' },
    { name: 'Balboa Park', expectedUrl: 'balboapark.org' },
  ];

  specificChecks.forEach(check => {
    const matches = allResources.filter(r =>
      r.name.toLowerCase().includes(check.name.toLowerCase())
    );

    matches.forEach(r => {
      if (!r.url.toLowerCase().includes(check.expectedUrl.toLowerCase())) {
        potentialMismatches.push({
          name: r.name,
          url: r.url,
          expected: check.expectedUrl
        });
      }
    });
  });

  console.log(`Potentiels non-coherences detectees: ${potentialMismatches.length}`);
  console.log();

  if (potentialMismatches.length > 0) {
    console.log('EXEMPLES:');
    potentialMismatches.slice(0, 10).forEach((m, i) => {
      console.log(`${i + 1}. Nom: "${m.name}"`);
      console.log(`   URL: ${m.url}`);
      console.log(`   Attendu: ${m.expected}`);
      console.log();
    });
  }

  // 4. Statistiques par catégorie
  console.log();
  console.log('4. STATISTIQUES PAR CATEGORIE');
  console.log('-'.repeat(80));

  const byCategory: any = {};
  allResources.forEach(r => {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  });

  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`${cat}: ${count}`);
  });

  console.log();
  console.log('================================================================================');
  console.log('VERIFICATION TERMINEE');
  console.log('================================================================================');
}

detailedCheck();
