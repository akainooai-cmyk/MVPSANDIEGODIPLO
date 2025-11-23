#!/usr/bin/env python3
"""
Script pour nettoyer les doublons et créer une version finale des ressources
"""

import json
from datetime import datetime

def clean_duplicates():
    """Nettoie les doublons des propositions IVLP"""

    # Charger les données
    with open('database_resources.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    resources = data['resources']

    print("="*80)
    print("NETTOYAGE DES DOUBLONS")
    print("="*80)
    print(f"\nTotal de propositions avant nettoyage: {len(resources)}\n")

    # Stratégie de nettoyage :
    # 1. Pour les doublons exacts, garder la version la plus récente (FY le plus élevé)
    # 2. Pour les propositions similaires mais d'années différentes, les garder toutes

    # Créer un dictionnaire par titre normalisé
    title_dict = {}

    for resource in resources:
        # Normaliser le titre
        title_norm = resource['title'].lower().strip()
        title_norm = title_norm.replace('_', ' ')
        title_norm = title_norm.replace('  ', ' ')

        if title_norm not in title_dict:
            title_dict[title_norm] = []
        title_dict[title_norm].append(resource)

    # Nettoyer les doublons
    cleaned_resources = []
    removed_count = 0

    for title_norm, items in title_dict.items():
        if len(items) == 1:
            # Pas de doublon, garder tel quel
            cleaned_resources.append(items[0])
        else:
            # Plusieurs items avec le même titre
            print(f"Doublon detecte: {items[0]['title']}")
            print(f"  Nombre d'instances: {len(items)}")

            # Trier par année fiscale (FY2026 > FY2025 > FY2024 > FY2023)
            # puis par priorité
            sorted_items = sorted(items, key=lambda x: (
                x['fiscal_year'],
                x['priority']
            ), reverse=True)

            # Garder le plus récent
            kept = sorted_items[0]
            cleaned_resources.append(kept)
            print(f"  Conserve: {kept['fiscal_year']} - {kept['id']}")

            # Marquer les autres comme supprimés
            for item in sorted_items[1:]:
                print(f"  Supprime: {item['fiscal_year']} - {item['id']}")
                removed_count += 1
            print()

    print(f"\nTotal de propositions apres nettoyage: {len(cleaned_resources)}")
    print(f"Propositions supprimees: {removed_count}\n")

    # Recalculer les statistiques
    summary = {
        'total_resources': len(cleaned_resources),
        'by_status': {},
        'by_fiscal_year': {},
        'by_theme': {},
        'by_region': {},
        'active_count': 0,
        'archived_count': 0
    }

    for resource in cleaned_resources:
        # Par statut
        status = resource['status']
        summary['by_status'][status] = summary['by_status'].get(status, 0) + 1

        # Par année fiscale
        fy = resource['fiscal_year']
        summary['by_fiscal_year'][fy] = summary['by_fiscal_year'].get(fy, 0) + 1

        # Par thème
        for theme in resource['themes']:
            summary['by_theme'][theme] = summary['by_theme'].get(theme, 0) + 1

        # Par région
        for region in resource['regions']:
            summary['by_region'][region] = summary['by_region'].get(region, 0) + 1

        # Compteurs actif/archivé
        if resource['is_active']:
            summary['active_count'] += 1
        else:
            summary['archived_count'] += 1

    # Créer la version nettoyée
    cleaned_data = {
        'summary': summary,
        'resources': cleaned_resources,
        'last_updated': datetime.now().isoformat(),
        'data_source': 'C:\\Users\\yoanb\\Desktop\\MVPSandiegodiplo\\Ressource',
        'cleaned': True,
        'removed_duplicates': removed_count
    }

    # Sauvegarder
    output_path = 'database_resources_cleaned.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)

    print("="*80)
    print("STATISTIQUES FINALES")
    print("="*80)
    print(f"\nTotal de ressources: {summary['total_resources']}")
    print(f"Ressources actives (FY2025-2026): {summary['active_count']}")
    print(f"Ressources archivees (FY2023-2024): {summary['archived_count']}")

    print(f"\nPar statut:")
    for status, count in sorted(summary['by_status'].items(), key=lambda x: x[1], reverse=True):
        status_label = {
            'upcoming': '[A VENIR]',
            'current': '[ACTUEL]',
            'archived': '[ARCHIVE]'
        }.get(status, status)
        print(f"  {status_label}: {count} ressources")

    print(f"\nFichier nettoye sauvegarde: {output_path}")
    print()

    return cleaned_data

if __name__ == "__main__":
    clean_duplicates()
