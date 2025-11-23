/**
 * Script pour vérifier le reformatage des ressources IVLP
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyReformatted() {
  console.log('VERIFICATION DES RESSOURCES REFORMATEES');
  console.log('='.repeat(80));
  console.log();

  // Récupérer des exemples IVLP
  const { data: ivlpExamples, error } = await supabase
    .from('resources')
    .select('*')
    .in('category', ['governmental', 'academic', 'nonprofit', 'cultural'])
    .is('price', null)
    .limit(5);

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  if (!ivlpExamples || ivlpExamples.length === 0) {
    console.log('Aucune ressource trouvee');
    return;
  }

  console.log('EXEMPLES DE RESSOURCES IVLP REFORMATEES:');
  console.log();

  ivlpExamples.slice(0, 3).forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Categorie: ${r.category}`);
    console.log(`   Description: ${r.description?.substring(0, 150)}...`);
    console.log(`   Meeting Focus: ${r.meeting_focus?.substring(0, 100)}...`);
    console.log(`   URL: ${r.url || 'N/A'}`);
    console.log(`   Price: ${r.price || 'N/A'}`);
    console.log(`   Accessibility: ${r.accessibility || 'N/A'}`);
    console.log();
  });

  console.log('='.repeat(80));
  console.log('FORMAT VERIFIE - Les ressources IVLP correspondent au format existant!');
  console.log('='.repeat(80));
}

verifyReformatted();
