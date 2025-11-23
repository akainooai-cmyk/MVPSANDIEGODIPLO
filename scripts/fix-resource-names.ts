/**
 * Script pour corriger les noms de ressources incorrects
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://biiguoetdgqmcsoozvnc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpaWd1b2V0ZGdxbWNzb296dm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgyNzEwMCwiZXhwIjoyMDc5NDAzMTAwfQ.-U6VfKXxttnHACSra2-qF95h7bqM1n6sCwTzlvg9zaA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Corrections manuelles pour les noms problématiques
const nameCorrections: { [key: string]: string } = {
  // Meeting Focus - extraire le nom de l'organisation de la description
  "Meeting Focus: Discover the variety of arts that strengthens the U.S.-Vietnamese people-to-people ties.": "Vietnamese Heritage Museum (VHM)",
  "Meeting Focus: Discuss how leadership strategies and communication skills vary to build voter engagement.": "Engage San Diego",
  "Meeting Focus: Discuss policy solutions for addressing social determinants of health.": "SDSU Institute for Public Health",
  "Meeting Focus: Discuss prevention and rehabilitation methods within the local lens of the government.": "Live Well San Diego - Behavioral Health Services",
  "Meeting Focus: Discuss strategies for empowering underserved entrepreneurs and increasing access to capital and resources.": "Community Development Corporation",
  "Meeting Focus: Engage and explore the value of public-private private partnerships in creative industries.": "Creative Industries Partnership",
  "Meeting Focus: Examine community development centric solutions to improve access to healthcare for communities.": "Community Health Access Program",
  "Meeting Focus: Examine how academic-community partnerships contribute to long-term CVE strategies and cross-sector collaboration.": "Academic-Community Partnership Initiative",
  "Meeting Focus: Examine how the U.S. Small Business Administration helps entrepreneurs build their financial stability.": "U.S. Small Business Administration - San Diego",
  "Meeting Focus: Examine interagency collaboration, evidence gathering, and prosecution strategies for human trafficking cases.": "Human Trafficking Prosecution Task Force",
  "Meeting Focus: Examine multi-agency coordination, analytical products, and fentanyl trend tracking to improve interdiction strategies.": "Multi-Agency Fentanyl Task Force",
  "Meeting Focus: Explore how Kitchen for Good benefits the underserved communities in San Diego.": "Kitchens for Good",
  "Meeting Focus: Explore how Professor Sloan's projects promote social advancement through economic advancement.": "UCSD Economic Advancement Research",
  "Meeting Focus: Explore how the program prepares for the impacts of climate change": "Climate Change Preparedness Program",
  "Meeting Focus: Explore local government-military (base-community) collaboration and cooperation.": "Local Government-Military Collaboration Program",
  "Meeting Focus: Explore strategies for increasing the Vietnamese community and job development through the arts.": "Vietnamese Arts & Community Development",
  "Meeting Focus: Explore sustainable landscaping techniques and the usefulness of drought-tolerant plants.": "Sustainable Landscaping Initiative",
  "Meeting Focus: Learn about CCSE's innovative strategies for promoting renewable energy adoption in local communities.": "CCSE Renewable Energy Program",
  "Meeting Focus: Learn about how racial inequality has impacted the San Diego education system.": "San Diego Education Equity Initiative",
  "Meeting Focus: Learn about how youth-led organizing efforts create real grass-roots change in local communities.": "Youth-Led Community Organizing",
  "Meeting focus: Learn how new ways of consuming help supporting local economy and producers.": "Local Economy Support Initiative",
  "Meeting Focus: Overview on CSUSM's Extended Learning opportunities and their successful international partnerships.": "CSUSM Extended Learning",
  "Meeting Focus: Review the judicial process for prosecuting trafficking offenders and developing evidence-based victim-centered approaches.": "Trafficking Prosecution & Victim Support",
  "Meeting Focus: This meeting will dive into distinguishing preventatives for foreign malign propaganda.": "Foreign Propaganda Prevention Program",
  "Meeting Focus: Understand cross-border victim identification, trauma recovery, and international NGO coordination.": "Cross-Border Victim Services",
  "Meeting Focus: Visit a public health institute to explore their approaches to global health responses.": "Public Health Institute - Global Health",
  "Meeting Focus: Workshop on how modern-day journalism handles contouring of information in the media.": "Modern Journalism Workshop",

  // Autres corrections
  "(This resource necessitates coordination through a gatekeeper, DOS, to arrange this meeting.)": "Naval Base Coronado (NBC)",
  "**Home Hospitality can be offered for the group, as well as a volunteer activity **": "Cultural Activities & Home Hospitality Program",
  "*Home Hospitality can be offered for the group, as well as a volunteer activity *": "People Assisting the Homeless (PATH)",
  "combating criminal organizations illegally exploiting America's travel, trade, financial and immigration": "Homeland Security Investigations (HSI)",
  "Controlled Thermal Resources *Graduate of Cleantech San Diego's SCEIN Incubator program above": "Controlled Thermal Resources",
  "Fonna Forman - University of California, Climate Change, Policy and Political Science": "UC San Diego - Climate Equity Research (Prof. Fonna Forman)",
  "Jeremy M. Martin, Institute of the Americas Energy Program, University of California San Diego": "Institute of the Americas Energy Program",
  "Kyle Handley is an economist who specializes in international trade, investment, uncertainty and": "UC San Diego - International Trade Research (Prof. Kyle Handley)",
  "Mary Brinson, Assistant Professor of Communication Studies at the University of San Diego": "University of San Diego - Media Studies (Prof. Mary Brinson)",
  "POINT LOMA NAZERENE UNIVERSITY: Jamie Gates, Former Director of the Center for Justice & Reconciliation": "Point Loma Nazarene University - Center for Justice & Reconciliation",
  "Price: $64.99 for one Adult Ticket (when purchased online); $109.99 at box office": "San Diego Attraction Ticket Pricing",
  "Samantha Murray at Scripps Institution of Oceanography: Center for Marine Biodiversity and Conservation": "Scripps Institution of Oceanography - Marine Biodiversity Center",
  "SAY San Diego Crawford Community Connection & San Diego Unified School District (SDUSD) Family": "SAY San Diego & SDUSD Partnership",
};

async function fixResourceNames() {
  console.log('Correction des noms de ressources problematiques');
  console.log('='.repeat(100));
  console.log();

  let correctionCount = 0;
  let errors = 0;

  for (const [oldName, newName] of Object.entries(nameCorrections)) {
    try {
      // Vérifier si la ressource existe
      const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('id, name, meeting_focus')
        .eq('name', oldName)
        .maybeSingle();

      if (fetchError) {
        console.error(`Erreur lors de la recherche de "${oldName}":`, fetchError);
        errors++;
        continue;
      }

      if (!resource) {
        console.log(`⚠ Ressource non trouvee: "${oldName}"`);
        continue;
      }

      // Pour les "Meeting Focus:", on déplace le texte vers meeting_focus si vide
      const updates: any = { name: newName };

      if (oldName.startsWith('Meeting Focus:') && !resource.meeting_focus) {
        const meetingFocusText = oldName.replace('Meeting Focus:', '').trim();
        updates.meeting_focus = meetingFocusText;
      }

      // Mettre à jour la ressource
      const { error: updateError } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', resource.id);

      if (updateError) {
        console.error(`Erreur lors de la mise a jour de "${oldName}":`, updateError);
        errors++;
      } else {
        console.log(`✓ Corrige: "${oldName.substring(0, 60)}..." -> "${newName}"`);
        correctionCount++;
      }
    } catch (error) {
      console.error(`Erreur pour "${oldName}":`, error);
      errors++;
    }
  }

  console.log();
  console.log('='.repeat(100));
  console.log(`Corrections effectuees: ${correctionCount}`);
  console.log(`Erreurs: ${errors}`);
  console.log(`Non trouvees: ${Object.keys(nameCorrections).length - correctionCount - errors}`);
}

fixResourceNames();
