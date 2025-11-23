/**
 * Script pour supprimer les emojis des descriptions des ressources IVLP
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function removeEmojis(text: string): string {
  if (!text) return text;

  // Supprimer tous les emojis
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis divers
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Symboles divers
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport et symboles
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Drapeaux
    .replace(/📅|📊|🎯|🌍|⭐/g, '')         // Emojis spécifiques utilisés
    .replace(/\s+/g, ' ')                   // Nettoyer les espaces multiples
    .trim();
}

async function fixEmojisInResources() {
  console.log('🔧 SUPPRESSION DES EMOJIS DES RESSOURCES IVLP');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1. Récupérer toutes les ressources avec des emojis dans la description
    console.log('📥 Récupération des ressources IVLP...');

    const { data: resources, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .or('description.like.%📅%,description.like.%📊%,description.like.%🎯%,description.like.%🌍%,description.like.%⭐%');

    if (fetchError) {
      throw fetchError;
    }

    if (!resources || resources.length === 0) {
      console.log('✅ Aucune ressource avec des emojis trouvée.');
      return;
    }

    console.log(`✅ ${resources.length} ressources avec emojis trouvées`);
    console.log();

    // 2. Nettoyer et mettre à jour chaque ressource
    console.log('🧹 Nettoyage en cours...');
    console.log();

    let successCount = 0;
    let errorCount = 0;

    for (const resource of resources) {
      const cleanedDescription = removeEmojis(resource.description || '');

      // Mettre à jour seulement si la description a changé
      if (cleanedDescription !== resource.description) {
        const { error: updateError } = await supabase
          .from('resources')
          .update({ description: cleanedDescription })
          .eq('id', resource.id);

        if (updateError) {
          console.error(`   ❌ Erreur pour ${resource.name}: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ ${resource.name.substring(0, 60)}...`);
          successCount++;
        }
      }
    }

    // 3. Résumé
    console.log();
    console.log('='.repeat(80));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`✅ Nettoyées avec succès: ${successCount} ressources`);
    console.log(`❌ Erreurs: ${errorCount} ressources`);
    console.log();

    if (successCount > 0) {
      console.log('✨ Emojis supprimés avec succès !');
    }

  } catch (error: any) {
    console.error();
    console.error('❌ ERREUR:', error.message);
    console.error();
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  fixEmojisInResources()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { fixEmojisInResources };
