#!/usr/bin/env python3
"""
Script pour extraire les organisations individuelles des propositions IVLP
et créer des ressources détaillées
"""

import os
import re
from docx import Document
from pathlib import Path
import json

def extract_organizations_from_docx(file_path):
    """Extrait les organisations d'un fichier IVLP .docx"""
    try:
        doc = Document(file_path)
        full_text = '\n'.join([para.text for para in doc.paragraphs if para.text.strip()])

        organizations = []
        current_org = None

        # Patterns pour détecter les sections
        url_pattern = r'https?://[^\s]+'

        lines = full_text.split('\n')
        i = 0

        while i < len(lines):
            line = lines[i].strip()

            # Détecter un nom d'organisation (souvent en gras ou suivi d'une URL)
            if line and not line.startswith('Meeting Focus:') and not line.startswith('Why '):
                # Vérifier si la ligne suivante contient une URL
                next_line = lines[i+1].strip() if i+1 < len(lines) else ''

                if re.search(url_pattern, next_line):
                    # C'est probablement une nouvelle organisation
                    if current_org and current_org.get('name'):
                        organizations.append(current_org)

                    current_org = {
                        'name': line,
                        'url': next_line,
                        'description': '',
                        'meeting_focus': ''
                    }
                    i += 2
                    continue

                # Détecter Meeting Focus
                elif line.startswith('Meeting Focus:'):
                    if current_org:
                        current_org['meeting_focus'] = line.replace('Meeting Focus:', '').strip()
                    i += 1
                    continue

                # Ajouter à la description
                elif current_org and line:
                    if not current_org['description']:
                        current_org['description'] = line
                    else:
                        current_org['description'] += ' ' + line

            i += 1

        # Ajouter la dernière organisation
        if current_org and current_org.get('name'):
            organizations.append(current_org)

        return organizations

    except Exception as e:
        print(f"Erreur lors de la lecture de {file_path}: {e}")
        return []

def extract_all_organizations():
    """Extrait toutes les organisations de toutes les propositions IVLP"""

    base_path = r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\Ressource'
    all_organizations = []

    print("Extraction des organisations des propositions IVLP...")
    print("="*80)
    print()

    # Parcourir tous les fichiers
    file_count = 0
    org_count = 0

    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.docx') and not file.startswith('~$'):
                file_path = os.path.join(root, file)
                file_count += 1

                # Déterminer l'année fiscale
                fiscal_year = None
                if 'FY2026' in root or 'FY 2026' in root:
                    fiscal_year = 'FY2026'
                elif 'FY2025' in root or 'FY 2025' in root:
                    fiscal_year = 'FY2025'
                elif 'FY 2024' in root or 'FY2024' in root:
                    fiscal_year = 'FY2024'
                elif 'FY2023' in root or 'FY 2023' in root:
                    fiscal_year = 'FY2023'

                print(f"Analyse: {file} ({fiscal_year})")

                orgs = extract_organizations_from_docx(file_path)

                if orgs:
                    print(f"  -> {len(orgs)} organisations trouvees")
                    org_count += len(orgs)

                    for org in orgs:
                        org['source_proposal'] = file
                        org['fiscal_year'] = fiscal_year
                        all_organizations.append(org)

    print()
    print("="*80)
    print(f"Total: {file_count} fichiers analyses")
    print(f"Total: {org_count} organisations extraites")
    print("="*80)
    print()

    # Sauvegarder
    output_path = r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\organizations_extracted.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_organizations, f, indent=2, ensure_ascii=False)

    print(f"Sauvegarde dans: {output_path}")
    print()

    # Afficher quelques exemples
    if all_organizations:
        print("Exemples d'organisations extraites:")
        print("-"*80)
        for org in all_organizations[:3]:
            print(f"\nNom: {org.get('name', 'N/A')}")
            print(f"URL: {org.get('url', 'N/A')}")
            print(f"Description: {org.get('description', 'N/A')[:150]}...")
            print(f"Meeting Focus: {org.get('meeting_focus', 'N/A')[:100]}...")
            print(f"Source: {org.get('source_proposal', 'N/A')} ({org.get('fiscal_year', 'N/A')})")

    return all_organizations

if __name__ == "__main__":
    extract_all_organizations()
