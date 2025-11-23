/**
 * Script pour vérifier la structure des ressources existantes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingResources() {
  console.log('Verification de la structure des ressources existantes');
  console.log('='.repeat(80));
  console.log();

  // Récupérer toutes les ressources
  const { data: allResources, error } = await supabase
    .from('resources')
    .select('*')
    .limit(200);

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  if (!allResources || allResources.length === 0) {
    console.log('Aucune ressource trouvee');
    return;
  }

  console.log(`Total de ressources: ${allResources.length}`);
  console.log();

  // Séparer les IVLP des autres
  const ivlpResources = allResources.filter(r =>
    r.description && (r.description.includes('Annee Fiscale') || r.description.includes('Année Fiscale'))
  );

  const otherResources = allResources.filter(r =>
    !r.description || (!r.description.includes('Annee Fiscale') && !r.description.includes('Année Fiscale'))
  );

  console.log(`Ressources IVLP: ${ivlpResources.length}`);
  console.log(`Autres ressources: ${otherResources.length}`);
  console.log();

  if (otherResources.length > 0) {
    console.log('='.repeat(80));
    console.log('EXEMPLE DE RESSOURCE EXISTANTE (non-IVLP):');
    console.log('='.repeat(80));

    const example = otherResources[0];
    console.log(`ID: ${example.id}`);
    console.log(`Nom: ${example.name}`);
    console.log(`Categorie: ${example.category}`);
    console.log(`Description: ${example.description || 'null'}`);
    console.log(`URL: ${example.url || 'null'}`);
    console.log(`Meeting Focus: ${example.meeting_focus || 'null'}`);
    console.log(`Price: ${example.price || 'null'}`);
    console.log(`Accessibility: ${example.accessibility || 'null'}`);
    console.log(`Is Active: ${example.is_active}`);
    console.log();

    // Afficher quelques autres exemples
    console.log('Autres exemples de ressources non-IVLP:');
    console.log('-'.repeat(80));
    otherResources.slice(1, 4).forEach((r, i) => {
      console.log(`${i + 2}. ${r.name}`);
      console.log(`   Categorie: ${r.category}`);
      console.log(`   URL: ${r.url || 'N/A'}`);
      console.log(`   Meeting Focus: ${r.meeting_focus || 'N/A'}`);
      console.log();
    });
  }

  if (ivlpResources.length > 0) {
    console.log('='.repeat(80));
    console.log('EXEMPLE DE RESSOURCE IVLP:');
    console.log('='.repeat(80));

    const example = ivlpResources[0];
    console.log(`ID: ${example.id}`);
    console.log(`Nom: ${example.name}`);
    console.log(`Categorie: ${example.category}`);
    console.log(`Description: ${example.description?.substring(0, 200)}...`);
    console.log(`URL: ${example.url || 'null'}`);
    console.log(`Meeting Focus: ${example.meeting_focus}`);
    console.log(`Price: ${example.price}`);
    console.log(`Accessibility: ${example.accessibility}`);
    console.log();
  }
}

checkExistingResources();
