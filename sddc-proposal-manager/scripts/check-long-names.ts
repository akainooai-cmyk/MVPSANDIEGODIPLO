/**
 * Script pour vérifier les noms de ressources trop longs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLongNames() {
  console.log('Verification des noms de ressources trop longs');
  console.log('='.repeat(100));
  console.log();

  const { data, error } = await supabase
    .from('resources')
    .select('id, name, category, description')
    .order('name');

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log('Total de ressources:', data.length);
  console.log();

  // Noms très longs (plus de 80 caractères)
  const veryLongNames = data.filter(r => r.name.length > 80);

  console.log('Ressources avec noms TRES longs (> 80 caracteres):');
  console.log('-'.repeat(100));
  veryLongNames.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.name.length} chars] ${r.name}`);
    console.log(`   Categorie: ${r.category}`);
    console.log();
  });

  // Noms moyennement longs (50-80 caractères)
  const mediumLongNames = data.filter(r => r.name.length > 50 && r.name.length <= 80);

  console.log();
  console.log('Ressources avec noms moyennement longs (50-80 caracteres):');
  console.log('-'.repeat(100));
  mediumLongNames.slice(0, 10).forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.name.length} chars] ${r.name}`);
    console.log(`   Categorie: ${r.category}`);
    console.log();
  });

  // Statistiques
  console.log();
  console.log('='.repeat(100));
  console.log('STATISTIQUES:');
  console.log(`- Noms > 80 caracteres: ${veryLongNames.length}`);
  console.log(`- Noms 50-80 caracteres: ${mediumLongNames.length}`);
  console.log(`- Noms < 50 caracteres: ${data.filter(r => r.name.length <= 50).length}`);
  console.log(`- Total: ${data.length}`);

  // Sauvegarder les noms problématiques dans un fichier
  console.log();
  console.log('Sauvegarde des noms problematiques...');

  const fs = require('fs');
  const problematicNames = veryLongNames.map(r => ({
    id: r.id,
    name: r.name,
    length: r.name.length,
    category: r.category,
    description: r.description
  }));

  fs.writeFileSync(
    'problematic-names.json',
    JSON.stringify(problematicNames, null, 2)
  );

  console.log('Fichier problematic-names.json cree avec', problematicNames.length, 'ressources');
}

checkLongNames();
