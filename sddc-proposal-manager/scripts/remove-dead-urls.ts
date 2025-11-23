import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://biiguoetdgqmcsoozvnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA'
);

async function removeDeadUrls() {
  console.log('SUPPRESSION DES URLs MORTES');
  console.log('='.repeat(80));

  const deadUrls = [
    'https://www.sandiego.gov/race-equity/about-us',
    'https://cleansd.org/about-2/',
  ];

  const { data, error } = await supabase
    .from('resources')
    .select('id, name, url')
    .in('url', deadUrls);

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('Aucune URL morte trouvee dans la base');
    return;
  }

  console.log(`URLs mortes trouvees: ${data.length}`);
  data.forEach(r => {
    console.log(`  - ${r.name}`);
    console.log(`    URL: ${r.url}`);
  });
  console.log();

  const ids = data.map(r => r.id);
  const { error: deleteError } = await supabase
    .from('resources')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('Erreur suppression:', deleteError);
  } else {
    console.log(`Supprimees: ${data.length} ressources`);
  }

  const { count } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  console.log(`Total ressources restantes: ${count}`);
}

removeDeadUrls();
