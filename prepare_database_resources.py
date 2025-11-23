#!/usr/bin/env python3
"""
Script pour préparer les ressources pour la base de données du site
avec vérification de l'actualité
"""

import json
from datetime import datetime

def determine_status(fiscal_year):
    """Détermine le statut d'actualité d'une proposition"""
    current_year = 2025  # Année actuelle (novembre 2025)

    if fiscal_year == 'FY2026':
        return 'upcoming'  # Propositions à venir
    elif fiscal_year == 'FY2025':
        return 'current'  # Propositions actuelles
    elif fiscal_year in ['FY2024', 'FY2023']:
        return 'archived'  # Propositions archivées mais encore pertinentes
    else:
        return 'unknown'

def format_for_database(proposals):
    """Formate les propositions pour la base de données"""

    resources = []

    for idx, proposal in enumerate(proposals, 1):
        # Déterminer le statut
        status = determine_status(proposal.get('fiscal_year', ''))

        # Déterminer la priorité (plus récent = plus prioritaire)
        priority_map = {
            'FY2026': 4,
            'FY2025': 3,
            'FY2024': 2,
            'FY2023': 1
        }
        priority = priority_map.get(proposal.get('fiscal_year', ''), 0)

        # Créer la ressource formatée
        resource = {
            'id': f"IVLP-{proposal.get('fiscal_year', 'UNKNOWN')}-{idx:03d}",
            'title': proposal.get('title', ''),
            'description': proposal.get('text_preview', ''),
            'type': 'IVLP Proposal',
            'fiscal_year': proposal.get('fiscal_year', ''),
            'status': status,
            'priority': priority,
            'themes': proposal.get('themes', []),
            'regions': proposal.get('regions', []),
            'file_path': proposal.get('file_path', ''),
            'filename': proposal.get('filename', ''),
            'created_date': datetime.now().isoformat(),
            'is_active': status in ['current', 'upcoming'],  # Seules les propositions actuelles et à venir sont actives
            'metadata': {
                'years_mentioned': proposal.get('years_mentioned', []),
                'document_type': 'docx' if proposal.get('file_path', '').endswith('.docx') else 'pdf'
            }
        }

        resources.append(resource)

    return resources

def create_summary(resources):
    """Crée un résumé des ressources"""

    summary = {
        'total_resources': len(resources),
        'by_status': {},
        'by_fiscal_year': {},
        'by_theme': {},
        'by_region': {},
        'active_count': 0,
        'archived_count': 0
    }

    for resource in resources:
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

    return summary

def main():
    # Charger l'inventaire
    with open(r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\proposals_inventory.json', 'r', encoding='utf-8') as f:
        proposals = json.load(f)

    # Formater pour la base de données
    resources = format_for_database(proposals)

    # Créer le résumé
    summary = create_summary(resources)

    # Sauvegarder les ressources formatées
    output_data = {
        'summary': summary,
        'resources': resources,
        'last_updated': datetime.now().isoformat(),
        'data_source': 'C:\\Users\\yoanb\\Desktop\\MVPSandiegodiplo\\Ressource'
    }

    output_path = r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\database_resources.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    # Créer aussi une version CSV pour faciliter l'import
    import csv
    csv_path = r'C:\Users\yoanb\Desktop\MVPSandiegodiplo\database_resources.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'id', 'title', 'fiscal_year', 'status', 'priority',
            'themes', 'regions', 'is_active', 'file_path'
        ])
        writer.writeheader()
        for resource in resources:
            writer.writerow({
                'id': resource['id'],
                'title': resource['title'],
                'fiscal_year': resource['fiscal_year'],
                'status': resource['status'],
                'priority': resource['priority'],
                'themes': ', '.join(resource['themes']),
                'regions': ', '.join(resource['regions']),
                'is_active': resource['is_active'],
                'file_path': resource['file_path']
            })

    # Afficher le résumé
    print(f"\n{'='*80}")
    print(f"RESSOURCES PRÉPARÉES POUR LA BASE DE DONNÉES")
    print(f"{'='*80}")
    print(f"\nTotal de ressources: {summary['total_resources']}")
    print(f"Ressources actives (FY2025-2026): {summary['active_count']}")
    print(f"Ressources archivées (FY2023-2024): {summary['archived_count']}")

    print(f"\n{'='*40}")
    print(f"STATUT D'ACTUALITE")
    print(f"{'='*40}")
    for status, count in sorted(summary['by_status'].items(), key=lambda x: x[1], reverse=True):
        status_label = {
            'upcoming': '[A VENIR] (FY2026)',
            'current': '[ACTUEL] (FY2025)',
            'archived': '[ARCHIVE] (FY2023-2024)'
        }.get(status, status)
        print(f"  {status_label}: {count} ressources")

    print(f"\n{'='*40}")
    print(f"THEMES PRINCIPAUX")
    print(f"{'='*40}")
    for theme, count in sorted(summary['by_theme'].items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {theme}: {count} ressources")

    print(f"\n{'='*40}")
    print(f"REGIONS COUVERTES")
    print(f"{'='*40}")
    for region, count in sorted(summary['by_region'].items(), key=lambda x: x[1], reverse=True):
        print(f"  {region}: {count} ressources")

    print(f"\n{'='*40}")
    print(f"FICHIERS GENERES")
    print(f"{'='*40}")
    print(f"  JSON: {output_path}")
    print(f"  CSV: {csv_path}")

    print(f"\n{'='*40}")
    print(f"RECOMMANDATIONS")
    print(f"{'='*40}")
    print(f"""
  1. PRIORITE HAUTE - Ressources actuelles et a venir:
     * {summary['by_status'].get('current', 0)} propositions FY2025 (actuelles)
     * {summary['by_status'].get('upcoming', 0)} propositions FY2026 (a venir)
     Ces ressources doivent etre mises en avant sur le site.

  2. PRIORITE MOYENNE - Ressources archivees:
     * {summary['by_status'].get('archived', 0)} propositions FY2023-2024
     Ces ressources restent pertinentes comme reference historique.

  3. STRUCTURE DE LA BASE DE DONNEES:
     - Utiliser le champ 'priority' pour trier les ressources (4=le plus recent)
     - Filtrer par 'is_active=true' pour afficher uniquement les propositions actuelles
     - Utiliser 'themes' et 'regions' pour la navigation par categorie
     - Le champ 'status' permet d'afficher des badges (A venir, Actuel, Archive)
    """)

if __name__ == "__main__":
    main()
