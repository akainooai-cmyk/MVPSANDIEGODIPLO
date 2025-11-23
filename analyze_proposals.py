#!/usr/bin/env python3
"""
Script pour analyser les propositions IVLP et créer un inventaire structuré
"""

import os
import json
from pathlib import Path
from docx import Document
from datetime import datetime
import re

def extract_text_from_docx(file_path):
    """Extrait le texte d'un fichier .docx"""
    try:
        doc = Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        print(f"Erreur lors de la lecture de {file_path}: {e}")
        return None

def extract_proposal_info(file_path, text):
    """Extrait les informations clés d'une proposition"""
    if not text:
        return None

    # Extraire le nom du fichier sans extension
    filename = Path(file_path).stem

    # Déterminer l'année fiscale depuis le chemin
    fy_year = None
    if 'FY2026' in file_path or 'FY 2026' in file_path:
        fy_year = 'FY2026'
    elif 'FY2025' in file_path or 'FY 2025' in file_path:
        fy_year = 'FY2025'
    elif 'FY 2024' in file_path or 'FY2024' in file_path:
        fy_year = 'FY2024'
    elif 'FY2023' in file_path or 'FY 2023' in file_path:
        fy_year = 'FY2023'

    # Extraire les premières lignes pour le titre et la description
    lines = text.split('\n')[:20]

    # Chercher des mots-clés thématiques
    themes = []
    keywords = {
        'Climate': ['climate', 'environmental', 'sustainability', 'renewable energy', 'conservation'],
        'Security': ['security', 'terrorism', 'extremism', 'transnational crime'],
        'Health': ['health', 'pandemic', 'medical', 'healthcare', 'fentanyl', 'opioid'],
        'Economy': ['economic', 'entrepreneurship', 'business', 'trade', 'market'],
        'Human Rights': ['human rights', 'civil rights', 'gender', 'violence', 'trafficking'],
        'Education': ['education', 'university', 'youth', 'student'],
        'Democracy': ['democracy', 'governance', 'transparency', 'accountability', 'civic'],
        'Technology': ['technology', 'digital', 'cybersecurity', 'innovation'],
        'Migration': ['migration', 'refugee', 'displaced'],
        'Maritime': ['maritime', 'ocean', 'fisheries', 'blue economy'],
        'Energy': ['energy', 'oil', 'gas', 'renewable'],
        'Arts & Culture': ['arts', 'culture', 'heritage', 'creative']
    }

    text_lower = text.lower()
    for theme, words in keywords.items():
        if any(word in text_lower for word in words):
            themes.append(theme)

    # Chercher des dates dans le texte
    date_pattern = r'\b(20\d{2})\b'
    years_mentioned = list(set(re.findall(date_pattern, text[:1000])))

    # Chercher des pays/régions
    regions = []
    region_keywords = {
        'Indo-Pacific': ['indo-pacific', 'pacific', 'quad'],
        'Europe': ['europe', 'european', 'transatlantic', 'eurasia'],
        'Africa': ['africa', 'african'],
        'Americas': ['latin america', 'mexico', 'argentina', 'brazil'],
        'Middle East': ['middle east', 'arab'],
        'Asia': ['asia', 'asian', 'vietnam', 'china'],
        'Central Asia': ['central asia', 'turkmenistan']
    }

    for region, words in region_keywords.items():
        if any(word in text_lower for word in words):
            regions.append(region)

    return {
        'filename': filename,
        'fiscal_year': fy_year,
        'title': filename.replace('_', ' ').replace('-', ' - '),
        'themes': themes[:3] if themes else ['General'],
        'regions': regions if regions else ['Global'],
        'years_mentioned': sorted(years_mentioned) if years_mentioned else [],
        'file_path': file_path,
        'text_preview': ' '.join(lines[:3])[:300] + '...' if len(' '.join(lines[:3])) > 300 else ' '.join(lines[:3])
    }

def analyze_all_proposals(base_path):
    """Analyse toutes les propositions et crée un inventaire"""
    proposals = []

    print("Analyse des propositions en cours...")

    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.docx') and not file.startswith('~$'):
                file_path = os.path.join(root, file)
                print(f"Analyse: {file}")

                text = extract_text_from_docx(file_path)
                info = extract_proposal_info(file_path, text)

                if info:
                    proposals.append(info)

    return proposals

def main():
    base_path = r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\Ressource'

    # Analyser toutes les propositions
    proposals = analyze_all_proposals(base_path)

    # Trier par année fiscale et titre
    proposals.sort(key=lambda x: (x['fiscal_year'] or '', x['title']))

    # Sauvegarder en JSON
    output_path = r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\proposals_inventory.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(proposals, f, indent=2, ensure_ascii=False)

    # Créer un résumé
    print(f"\n{'='*80}")
    print(f"ANALYSE TERMINÉE")
    print(f"{'='*80}")
    print(f"Total de propositions analysées: {len(proposals)}")

    # Statistiques par année fiscale
    by_year = {}
    for p in proposals:
        year = p.get('fiscal_year', 'Unknown')
        by_year[year] = by_year.get(year, 0) + 1

    print(f"\nRépartition par année fiscale:")
    for year in sorted(by_year.keys()):
        print(f"  {year}: {by_year[year]} propositions")

    # Statistiques par thème
    theme_count = {}
    for p in proposals:
        for theme in p.get('themes', []):
            theme_count[theme] = theme_count.get(theme, 0) + 1

    print(f"\nThèmes principaux (top 10):")
    for theme, count in sorted(theme_count.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {theme}: {count} propositions")

    # Statistiques par région
    region_count = {}
    for p in proposals:
        for region in p.get('regions', []):
            region_count[region] = region_count.get(region, 0) + 1

    print(f"\nRégions couvertes:")
    for region, count in sorted(region_count.items(), key=lambda x: x[1], reverse=True):
        print(f"  {region}: {count} propositions")

    print(f"\nInventaire sauvegardé dans: {output_path}")

    return proposals

if __name__ == "__main__":
    main()
