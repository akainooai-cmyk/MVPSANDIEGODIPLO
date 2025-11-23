import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://biiguoetdgqmcsoozvnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA'
);

async function finalCleanup() {
  console.log('FINAL CLEANUP');
  console.log('='.repeat(80));

  // Récupérer toutes les ressources
  let allResources: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
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

  const toDelete: string[] = [];

  // 1. Supprimer noms génériques restants
  const genericNames = [
    'Academic and Research Institutions',
    'Non-Governmental Organizations and Community Activism',
    'Non-Governmental Organizations (NGOs)',
    'Nonprofit Organizations and Incubators',
  ];

  allResources.forEach(r => {
    if (genericNames.includes(r.name.trim())) {
      console.log(`Generique: ${r.name}`);
      toDelete.push(r.id);
    }
  });

  // 2. Supprimer incohérences Balboa Park
  allResources.forEach(r => {
    if (r.name.includes('Balboa Park') && !r.url.includes('balboapark.org')) {
      console.log(`Incoherence: ${r.name} -> ${r.url}`);
      if (!toDelete.includes(r.id)) {
        toDelete.push(r.id);
      }
    }
  });

  console.log();
  console.log(`Total a supprimer: ${toDelete.length}`);

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .in('id', toDelete);

    if (error) {
      console.error('Erreur:', error);
    } else {
      console.log(`Supprimees: ${toDelete.length}`);
    }
  }

  const { count } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  console.log(`Ressources restantes: ${count}`);
}

finalCleanup();
