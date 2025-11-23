#!/usr/bin/env python3
"""
Script pour détecter les doublons dans les propositions IVLP
"""

import json
from difflib import SequenceMatcher
from collections import defaultdict

def similarity(a, b):
    """Calcule la similarité entre deux chaînes (0 à 1)"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def normalize_title(title):
    """Normalise un titre pour la comparaison"""
    # Supprimer les caractères spéciaux communs
    normalized = title.lower()
    normalized = normalized.replace('_', ' ')
    normalized = normalized.replace('-', ' ')
    normalized = normalized.replace('  ', ' ')
    normalized = normalized.strip()
    return normalized

def detect_duplicates():
    """Détecte les doublons dans les propositions"""

    # Charger les données
    with open('database_resources.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    resources = data['resources']

    print("="*80)
    print("ANALYSE DES DOUBLONS - PROPOSITIONS IVLP")
    print("="*80)
    print(f"\nTotal de propositions a analyser: {len(resources)}\n")

    # 1. Détecter les doublons exacts par titre
    print("1. DETECTION DES TITRES IDENTIQUES")
    print("-"*80)

    title_groups = defaultdict(list)
    for resource in resources:
        title = normalize_title(resource['title'])
        title_groups[title].append(resource)

    exact_duplicates = {title: items for title, items in title_groups.items() if len(items) > 1}

    if exact_duplicates:
        print(f"Trouve {len(exact_duplicates)} groupes de doublons exacts:\n")
        for title, items in exact_duplicates.items():
            print(f"  Titre: {title}")
            print(f"  Nombre de doublons: {len(items)}")
            for item in items:
                print(f"    - {item['id']} ({item['fiscal_year']}) - {item['filename']}")
            print()
    else:
        print("Aucun doublon exact trouve.\n")

    # 2. Détecter les titres très similaires (> 85% de similarité)
    print("\n2. DETECTION DES TITRES SIMILAIRES (>85%)")
    print("-"*80)

    similar_pairs = []
    checked = set()

    for i, res1 in enumerate(resources):
        for j, res2 in enumerate(resources[i+1:], i+1):
            pair_key = tuple(sorted([res1['id'], res2['id']]))
            if pair_key in checked:
                continue
            checked.add(pair_key)

            sim = similarity(res1['title'], res2['title'])
            if sim > 0.85 and sim < 1.0:  # Très similaire mais pas identique
                similar_pairs.append((res1, res2, sim))

    if similar_pairs:
        print(f"Trouve {len(similar_pairs)} paires de titres similaires:\n")
        for res1, res2, sim in sorted(similar_pairs, key=lambda x: x[2], reverse=True):
            print(f"  Similarite: {sim:.1%}")
            print(f"    1. {res1['title']} ({res1['fiscal_year']})")
            print(f"    2. {res2['title']} ({res2['fiscal_year']})")
            print()
    else:
        print("Aucun titre similaire trouve.\n")

    # 3. Détecter les propositions sur le même sujet dans différentes années
    print("\n3. PROPOSITIONS SIMILAIRES DANS DIFFERENTES ANNEES FISCALES")
    print("-"*80)

    # Grouper par titre normalisé court (premiers mots)
    topic_groups = defaultdict(list)
    for resource in resources:
        # Prendre les 5 premiers mots significatifs
        words = normalize_title(resource['title']).split()[:5]
        topic_key = ' '.join(words)
        topic_groups[topic_key].append(resource)

    multi_year_topics = {topic: items for topic, items in topic_groups.items()
                         if len(items) > 1 and len(set(item['fiscal_year'] for item in items)) > 1}

    if multi_year_topics:
        print(f"Trouve {len(multi_year_topics)} sujets couverts sur plusieurs annees:\n")
        for topic, items in list(multi_year_topics.items())[:10]:  # Limiter à 10 exemples
            years = sorted(set(item['fiscal_year'] for item in items))
            print(f"  Sujet: {topic}...")
            print(f"  Annees: {', '.join(years)}")
            print(f"  Nombre de propositions: {len(items)}")
            for item in items:
                print(f"    - {item['fiscal_year']}: {item['title'][:60]}...")
            print()
    else:
        print("Aucun sujet multi-annees trouve.\n")

    # 4. Analyser les fichiers avec des noms très similaires
    print("\n4. ANALYSE DES NOMS DE FICHIERS")
    print("-"*80)

    filename_groups = defaultdict(list)
    for resource in resources:
        # Nettoyer le nom de fichier (enlever les numéros de version, etc.)
        filename = resource['filename'].lower()
        # Supprimer les patterns communs comme (1), (2), _2, etc.
        import re
        cleaned = re.sub(r'\s*\(\d+\)\s*', '', filename)
        cleaned = re.sub(r'\s+\d+\s*$', '', cleaned)
        cleaned = cleaned.strip()
        filename_groups[cleaned].append(resource)

    duplicate_filenames = {name: items for name, items in filename_groups.items() if len(items) > 1}

    if duplicate_filenames:
        print(f"Trouve {len(duplicate_filenames)} groupes de noms de fichiers similaires:\n")
        for filename, items in list(duplicate_filenames.items())[:10]:
            print(f"  Nom de fichier base: {filename}")
            print(f"  Variantes trouvees: {len(items)}")
            for item in items:
                print(f"    - {item['filename']} ({item['fiscal_year']})")
            print()
    else:
        print("Aucun nom de fichier similaire trouve.\n")

    # 5. Résumé et recommandations
    print("\n" + "="*80)
    print("RESUME DE L'ANALYSE")
    print("="*80)

    total_duplicates = len(exact_duplicates)
    total_similar = len(similar_pairs)
    total_multi_year = len(multi_year_topics)
    total_filename_dup = len(duplicate_filenames)

    print(f"\nDoublons exacts (titres identiques)     : {total_duplicates} groupes")
    print(f"Titres tres similaires (>85%)           : {total_similar} paires")
    print(f"Sujets couverts sur plusieurs annees    : {total_multi_year} sujets")
    print(f"Noms de fichiers similaires             : {total_filename_dup} groupes")

    print("\n" + "="*80)
    print("RECOMMANDATIONS")
    print("="*80)

    if total_duplicates > 0:
        print(f"\n⚠️  ACTION REQUISE: {total_duplicates} groupes de doublons exacts detectes")
        print("   → Supprimer les doublons en gardant la version la plus recente")

    if total_similar > 5:
        print(f"\n⚠️  ATTENTION: {total_similar} paires de titres tres similaires")
        print("   → Verifier s'il s'agit de versions differentes ou de propositions distinctes")

    if total_multi_year > 0:
        print(f"\n✅ NORMAL: {total_multi_year} sujets ont des propositions sur plusieurs annees")
        print("   → Ceci est normal, les propositions sont soumises chaque annee")

    if total_filename_dup > 0:
        print(f"\n⚠️  INFO: {total_filename_dup} groupes de fichiers avec noms similaires")
        print("   → Peut indiquer des versions ou des copies")

    # Créer un rapport JSON
    report = {
        'total_resources': len(resources),
        'exact_duplicates': len(exact_duplicates),
        'similar_titles': len(similar_pairs),
        'multi_year_topics': len(multi_year_topics),
        'duplicate_filenames': len(duplicate_filenames),
        'exact_duplicate_groups': {
            title: [{'id': item['id'], 'fiscal_year': item['fiscal_year'],
                    'filename': item['filename']} for item in items]
            for title, items in exact_duplicates.items()
        },
        'similar_pairs': [
            {
                'similarity': sim,
                'item1': {'id': res1['id'], 'title': res1['title'], 'fiscal_year': res1['fiscal_year']},
                'item2': {'id': res2['id'], 'title': res2['title'], 'fiscal_year': res2['fiscal_year']}
            }
            for res1, res2, sim in similar_pairs
        ]
    }

    with open('duplicates_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n📊 Rapport detaille sauvegarde dans: duplicates_report.json")
    print()

if __name__ == "__main__":
    detect_duplicates()
