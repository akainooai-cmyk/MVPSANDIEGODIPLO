/**
 * Script pour corriger les derniers noms de ressources trop longs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Corrections pour les noms restants
const nameCorrections: { [key: string]: string } = {
  "Juvenile Delinquency Prevention, Diversion and Intervention Program (BridgeWays & Community Assessment Team)": "San Diego Youth Services - BridgeWays & Community Assessment Team",
  "School Visit: La Jolla Country Day School (LJCDS) Center for Excellence in Citizenship (CEC)": "La Jolla Country Day School - Center for Excellence in Citizenship",
  "National Oceanic and Atmospheric Administration (NOAA) - Southwest Fisheries Science Center": "NOAA Southwest Fisheries Science Center",
  "San Diego County - Health & Human Services Agency (HHSA), Behavioral Health Services": "San Diego County HHSA - Behavioral Health Services",
  "San Diego Green Building Council- Tour of IQHQ Research and Development District (RaDD)": "San Diego Green Building Council - IQHQ RaDD Tour",
  "San Diego Natural History Museum, Biodiversity Research Center of the Californias (BRCC)": "San Diego Natural History Museum - BRCC",
  "San Diego Regional Economic Development Corporation (EDC), Monetizing Research through ASD": "San Diego Regional EDC - Monetizing Research",
  "SDSU Institute for Public Health - Center for Alcohol & Drug Studies and Services (CADSS)": "SDSU Institute for Public Health - CADSS",
  "The San Diego Human Trafficking Research and Data Advisory Roundtable (HT-	RADAR)": "San Diego Human Trafficking Research (HT-RADAR)",
  "The Transparent and Responsible Use of Surveillance Technology San Diego (TRUST SD)": "TRUST SD - Surveillance Technology Advisory",
  "U.S. Attorney's Office of the Southern District of California - Border Enforcement Section": "U.S. Attorney's Office SD - Border Enforcement",
  "U.S. Immigration & Customs Enforcement (ICE): Homeland Security Investigations (HSI)": "ICE Homeland Security Investigations (HSI)",
  "UCSD Disinformation Institute - (UC San Diego's School of Global Policy & Strategy)": "UCSD Disinformation Institute",
  "United States Environmental Protection Agency (EPA) - Border Liaison Office, San Diego - Border 2025": "EPA Border Liaison Office - San Diego",
  "University of California at San Diego (UCSD), Center for Comparative Immigration Studies": "UCSD Center for Comparative Immigration Studies",
  "University of San Diego, The Ahlers Center for International Business, International Exchanges and Partnerships": "University of San Diego - Ahlers Center for International Business",
};

async function fixRemainingNames() {
  console.log('Correction des derniers noms de ressources trop longs');
  console.log('='.repeat(100));
  console.log();

  let correctionCount = 0;
  let errors = 0;

  for (const [oldName, newName] of Object.entries(nameCorrections)) {
    try {
      const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('id, name')
        .eq('name', oldName)
        .maybeSingle();

      if (fetchError) {
        console.error(`Erreur lors de la recherche de "${oldName}":`, fetchError);
        errors++;
        continue;
      }

      if (!resource) {
        console.log(`⚠ Ressource non trouvee: "${oldName.substring(0, 60)}..."`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('resources')
        .update({ name: newName })
        .eq('id', resource.id);

      if (updateError) {
        console.error(`Erreur lors de la mise a jour:`, updateError);
        errors++;
      } else {
        console.log(`✓ ${oldName.length} chars -> ${newName.length} chars`);
        console.log(`  "${oldName.substring(0, 50)}..." -> "${newName}"`);
        console.log();
        correctionCount++;
      }
    } catch (error) {
      console.error(`Erreur:`, error);
      errors++;
    }
  }

  console.log('='.repeat(100));
  console.log(`Corrections effectuees: ${correctionCount}`);
  console.log(`Erreurs: ${errors}`);
  console.log(`Non trouvees: ${Object.keys(nameCorrections).length - correctionCount - errors}`);
}

fixRemainingNames();
