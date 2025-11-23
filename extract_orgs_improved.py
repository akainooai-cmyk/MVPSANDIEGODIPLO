#!/usr/bin/env python3
"""
Script ameliore pour extraire les organisations des propositions IVLP
"""

import os
import re
from docx import Document
import json

def clean_text(text):
    """Nettoie le texte"""
    if not text:
        return ''
    return text.replace('\u2019', "'").replace('\u2013', '-').replace('\u201c', '"').replace('\u201d', '"').strip()

def extract_organizations_improved(file_path):
    """Extrait les organisations avec une meilleure logique"""
    try:
        doc = Document(file_path)
        organizations = []
        current_org = None
        collecting_description = False

        for para in doc.paragraphs:
            text = clean_text(para.text)

            if not text:
                continue

            # Detecter une URL (debut d'organisation)
            url_match = re.search(r'https?://[^\s]+', text)

            if url_match and len(text) < 200:  # URL seule ou avec peu de texte
                # Sauvegarder l'organisation precedente
                if current_org and current_org.get('name'):
                    organizations.append(current_org)

                # Nouvelle organisation
                current_org = {
                    'name': '',
                    'url': url_match.group(0),
                    'description': '',
                    'meeting_focus': ''
                }
                collecting_description = True
                continue

            # Detecter le nom de l'organisation (paragraphe avant l'URL ou gras)
            if current_org and not current_org.get('name') and len(text) < 200 and text.count(' ') < 15:
                current_org['name'] = text
                continue

            # Detecter Meeting Focus
            if 'Meeting Focus:' in text or 'Meeting focus:' in text:
                if current_org:
                    meeting_text = re.sub(r'Meeting [Ff]ocus:\s*', '', text)
                    current_org['meeting_focus'] = clean_text(meeting_text)
                collecting_description = False
                continue

            # Collecter la description
            if current_org and collecting_description and text:
                # Ignorer certaines sections
                if text.startswith('Why ') or text.startswith('Project ') or text.startswith('_____'):
                    continue

                if current_org['description']:
                    current_org['description'] += ' ' + text
                else:
                    current_org['description'] = text

        # Ajouter la derniere organisation
        if current_org and current_org.get('name'):
            organizations.append(current_org)

        return organizations

    except Exception as e:
        print(f"Erreur: {e}")
        return []

def main():
    base_path = r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\Ressource'
    all_organizations = []

    print("Extraction amelioree des organisations...")
    print("="*80)
    print()

    # Test sur un fichier specifique d'abord
    test_file = r'Ressource/Proposals Sent FY2025-20251122T232159Z-1-001/Proposals Sent FY2025/Fentanyl and Protecting Public Health.docx'
    test_path = os.path.join(r'C:\Users\yoanb\Desktop\MVPSandiegodiplo', test_file)

    if os.path.exists(test_path):
        print("Test sur: Fentanyl and Protecting Public Health")
        print("-"*80)
        orgs = extract_organizations_improved(test_path)

        print(f"Organisations trouvees: {len(orgs)}")
        print()

        # Afficher les 3 premieres
        for i, org in enumerate(orgs[:3], 1):
            print(f"{i}. {org.get('name', 'NO NAME')}")
            print(f"   URL: {org.get('url', 'NO URL')}")
            print(f"   Description: {org.get('description', 'NO DESC')[:200]}...")
            print(f"   Meeting Focus: {org.get('meeting_focus', 'NO FOCUS')}")
            print()

        print("="*80)
        print("Test reussi ! Appuyez sur Entree pour continuer avec tous les fichiers...")
        # input()

    # Continuer avec tous les fichiers
    file_count = 0
    org_count = 0

    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.docx') and not file.startswith('~$'):
                file_path = os.path.join(root, file)
                file_count += 1

                # Determiner l'annee fiscale
                fiscal_year = None
                if 'FY2026' in root:
                    fiscal_year = 'FY2026'
                elif 'FY2025' in root:
                    fiscal_year = 'FY2025'
                elif 'FY 2024' in root or 'FY2024' in root:
                    fiscal_year = 'FY2024'
                elif 'FY2023' in root:
                    fiscal_year = 'FY2023'

                orgs = extract_organizations_improved(file_path)

                if orgs:
                    print(f"{file}: {len(orgs)} orgs")
                    org_count += len(orgs)

                    for org in orgs:
                        org['source_proposal'] = file
                        org['fiscal_year'] = fiscal_year
                        all_organizations.append(org)

    print()
    print("="*80)
    print(f"Total: {file_count} fichiers")
    print(f"Total: {org_count} organisations")
    print("="*80)

    # Sauvegarder
    output_path = r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\organizations_improved.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_organizations, f, indent=2, ensure_ascii=False)

    print(f"Sauvegarde: {output_path}")

    # Statistiques
    with_url = len([o for o in all_organizations if o.get('url')])
    with_desc = len([o for o in all_organizations if o.get('description') and len(o['description']) > 50])
    with_focus = len([o for o in all_organizations if o.get('meeting_focus') and len(o['meeting_focus']) > 20])

    print()
    print(f"Avec URL: {with_url} ({with_url/len(all_organizations)*100:.1f}%)")
    print(f"Avec description: {with_desc} ({with_desc/len(all_organizations)*100:.1f}%)")
    print(f"Avec meeting focus: {with_focus} ({with_focus/len(all_organizations)*100:.1f}%)")

if __name__ == "__main__":
    main()
