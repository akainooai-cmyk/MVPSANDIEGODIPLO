/**
 * Script pour reformater les ressources IVLP selon le format des ressources existantes
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Charger les données originales
const dataPath = path.join(__dirname, '..', '..', 'database_resources_cleaned.json');
const fileContent = fs.readFileSync(dataPath, 'utf-8');
const originalData = JSON.parse(fileContent);

// Créer un mapping par titre
const dataMap = new Map();
originalData.resources.forEach((r: any) => {
  dataMap.set(r.title.toLowerCase().trim(), r);
});

/**
 * Créer une description propre et concise
 */
function createCleanDescription(ivlp: any): string {
  // Utiliser la description d'origine (preview) nettoyée
  let desc = ivlp.description || '';

  // Supprimer les métadonnées ajoutées
  desc = desc.split('Annee Fiscale:')[0];
  desc = desc.split('Année Fiscale:')[0];

  // Nettoyer
  desc = desc.trim();

  // Si trop long, tronquer intelligemment
  if (desc.length > 300) {
    desc = desc.substring(0, 297) + '...';
  }

  // Si vide, créer une description basée sur le titre
  if (!desc || desc.length < 20) {
    const themes = ivlp.themes.slice(0, 3).join(', ');
    const regions = ivlp.regions.slice(0, 2).join(' and ');
    desc = `IVLP proposal focusing on ${themes} for the ${regions} region. ${ivlp.fiscal_year} program.`;
  }

  return desc;
}

/**
 * Créer un meeting focus descriptif
 */
function createMeetingFocus(ivlp: any): string {
  const themes = ivlp.themes.slice(0, 2).join(' and ');
  const fy = ivlp.fiscal_year.replace('FY', 'FY ');

  const focusTemplates = {
    'Health': `Explore U.S. approaches to ${themes.toLowerCase()} initiatives and public health strategies.`,
    'Economy': `Learn about U.S. ${themes.toLowerCase()} models and economic development frameworks.`,
    'Climate': `Understand U.S. strategies for ${themes.toLowerCase()} and environmental sustainability.`,
    'Security': `Examine U.S. approaches to ${themes.toLowerCase()} and international cooperation.`,
    'Human Rights': `Explore how U.S. institutions promote ${themes.toLowerCase()} and democratic values.`,
    'Education': `Learn about U.S. ${themes.toLowerCase()} systems and educational innovation.`,
    'Democracy': `Understand U.S. frameworks for ${themes.toLowerCase()} and civic engagement.`,
    'Technology': `Explore U.S. leadership in ${themes.toLowerCase()} and innovation.`,
    'Arts & Culture': `Experience U.S. approaches to ${themes.toLowerCase()} and cultural exchange.`,
    'Maritime': `Learn about U.S. ${themes.toLowerCase()} policies and international partnerships.`,
  };

  // Choisir le template selon le premier thème
  const mainTheme = ivlp.themes[0];
  let focus = focusTemplates[mainTheme as keyof typeof focusTemplates] || `Explore U.S. approaches to ${themes.toLowerCase()} through professional exchange and site visits.`;

  // Ajouter le contexte FY si pertinent
  if (ivlp.status === 'upcoming') {
    focus = `[${fy} - Upcoming] ${focus}`;
  } else if (ivlp.status === 'current') {
    focus = `[${fy} - Current] ${focus}`;
  }

  return focus;
}

async function reformatIVLPResources() {
  console.log('REFORMATAGE DES RESSOURCES IVLP');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1. Récupérer toutes les ressources IVLP
    console.log('Recuperation des ressources IVLP...');

    const { data: ivlpResources, error: fetchError } = await supabase
      .from('resources')
      .select('*')
      .or('description.like.%Annee Fiscale%,description.like.%Année Fiscale%,price.like.%FY%');

    if (fetchError) throw fetchError;

    if (!ivlpResources || ivlpResources.length === 0) {
      console.log('Aucune ressource IVLP trouvee');
      return;
    }

    console.log(`Trouve: ${ivlpResources.length} ressources IVLP`);
    console.log();

    // 2. Reformater chaque ressource
    console.log('Reformatage en cours...');
    console.log();

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const resource of ivlpResources) {
      try {
        // Trouver les données originales
        const originalKey = resource.name.toLowerCase().trim();
        const original = dataMap.get(originalKey);

        if (!original) {
          console.log(`   ? ${resource.name.substring(0, 60)}... (pas de donnees originales)`);
          continue;
        }

        // Créer les nouveaux champs
        const cleanDescription = createCleanDescription(original);
        const meetingFocus = createMeetingFocus(original);

        // Mettre à jour
        const { error: updateError } = await supabase
          .from('resources')
          .update({
            description: cleanDescription,
            meeting_focus: meetingFocus,
            url: null,
            price: null,
            accessibility: null,
          })
          .eq('id', resource.id);

        if (updateError) {
          errors.push(`${resource.name}: ${updateError.message}`);
          errorCount++;
          console.log(`   X ${resource.name.substring(0, 60)}...`);
        } else {
          successCount++;
          console.log(`   OK ${resource.name.substring(0, 60)}...`);
        }

      } catch (err: any) {
        errors.push(`${resource.name}: ${err.message}`);
        errorCount++;
      }
    }

    // 3. Résumé
    console.log();
    console.log('='.repeat(80));
    console.log('RESUME');
    console.log('='.repeat(80));
    console.log(`Reussies: ${successCount} ressources`);
    console.log(`Erreurs: ${errorCount} ressources`);

    if (errors.length > 0) {
      console.log();
      console.log('Erreurs:');
      errors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
      if (errors.length > 5) {
        console.log(`  ... et ${errors.length - 5} autres erreurs`);
      }
    }

    console.log();
    if (successCount > 0) {
      console.log('Reformatage termine avec succes !');
      console.log();
      console.log('Les ressources IVLP ont maintenant:');
      console.log('  - Description: Texte clair et concis');
      console.log('  - Meeting Focus: Objectif descriptif de la proposition');
      console.log('  - URL: null');
      console.log('  - Price: null');
      console.log('  - Accessibility: null');
    }

  } catch (error: any) {
    console.error();
    console.error('ERREUR:', error.message);
    console.error();
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  reformatIVLPResources()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erreur:', error);
      process.exit(1);
    });
}

export { reformatIVLPResources };
