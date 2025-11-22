# 🧪 Guide de Test - SDDC Proposal Manager

## ✅ Phase 2 Complétée !

Félicitations ! L'application est maintenant fonctionnelle avec les fonctionnalités principales implémentées.

---

## 🚀 Comment Tester l'Application

### Préparation

1. **Supabase doit être configuré** (tu l'as déjà fait ✓)
2. **Serveur démarré** sur http://localhost:3003
3. **Variables d'environnement** configurées dans `.env.local`

---

## 📝 Scénario de Test Complet

### Étape 1: Authentification

1. **Aller sur** http://localhost:3003
2. Tu seras redirigé vers `/login`
3. Clique sur "Sign up" (si pas encore de compte)
4. **Créer un compte**:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
5. Tu seras redirigé vers le dashboard

### Étape 2: Créer un Projet

1. Depuis le dashboard, clique sur **"New Project"**
2. Remplis le formulaire:
   ```
   Project Name: Test IVLP Project
   Project Number: E/VRF-2025-0001
   Project Title: U.S.-ROK Partnership: Combating Fentanyl Trafficking
   Subject: Combating synthetic opioid trafficking
   Project Type: Single-Country
   Start Date: 2025-03-01
   End Date: 2025-03-15
   Participants: 5
   Sponsoring Agency: U.S. Department of State
   Description: A project to understand law enforcement strategies...
   ```
3. Clique **"Create Project"**
4. Tu seras redirigé vers la page du projet

### Étape 3: Upload des Documents

1. Sur la page du projet, tu verras 2 sections d'upload:
   - **Project Data (Required)**
   - **Bios & Objectives (Optional)**

2. **Pour tester sans document réel**:
   - Crée un fichier `.docx` simple dans Word
   - Ajoute du texte: "Project Data for test project"
   - Sauvegarde comme `project-data.docx`

3. **Upload le document**:
   - Drag & drop ou clique "Browse Files"
   - Sélectionne `project-data.docx`
   - Clique "Upload"
   - Attends la confirmation ✅

4. *Optionnel*: Upload aussi un document Bios & Objectives

### Étape 4: Générer le Proposal avec Claude AI

1. Une fois le **Project Data uploadé**, le bouton **"Generate Proposal"** devient actif
2. Clique sur **"Generate Proposal"**
3. **Attends 10-30 secondes** (Claude AI travaille!)
4. Tu seras automatiquement redirigé vers l'éditeur de proposal

### Étape 5: Voir le Proposal Généré

Dans l'éditeur, tu verras:
- ✅ **Why San Diego?** - Paragraphe généré par Claude
- ✅ **Governmental Resources** - Sélection pertinente depuis la DB
- ✅ **Academic Resources** - Si pertinent pour le projet
- ✅ **Nonprofit Resources** - Si pertinent
- ✅ **Cultural Activities** - Activités recommandées

Chaque ressource a:
- Nom de l'organisation
- URL
- Description
- **Meeting Focus** personnalisé au projet

### Étape 6: Éditer le Proposal

1. Tu peux modifier le texte "Why San Diego?" directement
2. Clique **"Save Changes"** pour sauvegarder
3. Retourne au projet avec le bouton "Back to Project"

### Étape 7: Voir la Liste des Projets

1. Clique sur **"Projects"** dans la sidebar
2. Tu verras ton projet avec:
   - Titre
   - Numéro
   - Statut (badge)
   - Dates
   - Participants
3. Les boutons **"View"** et **"Proposal"** sont disponibles

---

## 🎯 Fonctionnalités Testées

### ✅ Ce qui fonctionne maintenant:

- [x] **Authentification complète** (register, login, logout)
- [x] **Création de projets** avec formulaire complet
- [x] **Upload de documents** .docx avec drag & drop
- [x] **Extraction automatique** du contenu des documents
- [x] **Génération de proposals** avec Claude AI
- [x] **Sélection intelligente** des ressources San Diego
- [x] **Meeting Focus personnalisés** au projet
- [x] **Édition de proposals** avec interface complète
- [x] **Versioning automatique** des proposals
- [x] **Historique des modifications**
- [x] **Liste des projets** avec données réelles
- [x] **Navigation fluide** entre les pages

---

## 🔍 Détails Techniques

### Base de Données (Supabase)

Après avoir créé un projet et uploadé un document, vérifie dans Supabase:

1. **Table `projects`**: Ton nouveau projet
2. **Table `documents`**: Le fichier uploadé avec contenu extrait
3. **Table `proposals`**: Le proposal généré (version 1)
4. **Table `resources`**: Les ressources San Diego (seed data)
5. **Storage `documents`**: Le fichier .docx physique

### Claude AI

Le système fait:
1. Analyse le contenu extrait du document
2. Récupère toutes les ressources depuis la DB
3. Sélectionne uniquement les ressources pertinentes
4. Génère un "Why San Diego?" personnalisé
5. Crée des "Meeting Focus" spécifiques au projet
6. Retourne un JSON structuré

---

## 🧪 Tests Avancés

### Test 1: Upload Multiple

1. Crée un 2e projet
2. Upload les mêmes documents
3. Vérifie que chaque projet a ses propres documents

### Test 2: Mise à Jour

1. Édite le "Why San Diego?"
2. Sauvegarde
3. Vérifie que la version passe à 2
4. Check l'historique dans Supabase (`proposal_history`)

### Test 3: Multiple Projets

1. Crée 3-4 projets différents
2. Vérifie qu'ils apparaissent tous dans la liste
3. Navigue entre eux

### Test 4: Documents Types

1. Essaie d'uploader un PDF → Devrait être rejeté
2. Essaie un .doc (ancien format) → Devrait fonctionner
3. Essaie un .docx → Parfait

---

## 🐛 Debug / Troubleshooting

### Problème: "Unauthorized"

**Solution**: Tu n'es pas connecté
- Retourne sur `/login`
- Reconnecte-toi

### Problème: Upload échoue

**Solutions**:
1. Vérifie que le bucket `documents` existe dans Supabase Storage
2. Vérifie les policies RLS sur le storage
3. Vérifie que le fichier est bien .docx

### Problème: Generate Proposal ne marche pas

**Solutions**:
1. Vérifie `ANTHROPIC_API_KEY` dans `.env.local`
2. Vérifie que tu as uploadé le Project Data
3. Check la console pour les erreurs
4. Vérifie que la table `resources` a des données (seed)

### Problème: Proposal vide ou erreur

**Solutions**:
1. Les ressources doivent exister dans la DB (run seed SQL)
2. Claude AI doit avoir une clé valide
3. Le document Project Data doit avoir du contenu

---

## 📊 Données de Test

Si tu veux tester avec un vrai projet IVLP, crée un `.docx` avec:

```
Project Title: U.S.-ROK Partnership: Combating Fentanyl Trafficking
Project Number: E/VRF-2025-0055
Project Type: Single-Country
Dates: November 24 - December 12, 2025
Participants: 5

Subject: Combating synthetic opioid trafficking

Description:
This project will examine U.S. strategies for combating the
trafficking of synthetic opioids, particularly fentanyl.

Objectives:
1. Understand law enforcement collaboration strategies
2. Learn about border interdiction technologies
3. Examine public health responses to overdose crises
4. Explore prevention programs for youth
```

Sauvegarde et upload ce document. Claude AI va:
- Extraire ces infos automatiquement
- Sélectionner les ressources pertinentes (law enforcement, health, prevention)
- Générer un proposal cohérent

---

## 🎉 Prochaines Étapes

Après avoir testé, tu peux:

1. **Ajouter plus de ressources** dans Supabase
2. **Tester l'export PDF** (à implémenter)
3. **Ajouter le chat IA** (à implémenter)
4. **Améliorer l'éditeur** de proposal

---

## 💡 Tips

- Le premier upload et la première génération peuvent prendre plus de temps (cold start)
- Claude AI est très intelligent - plus tu donnes de détails dans le document, meilleur sera le proposal
- Les ressources sont automatiquement filtrées par pertinence
- Chaque modification crée une nouvelle version (historique complet)

---

**Bon test ! 🚀**

Si tu rencontres un problème, vérifie d'abord:
1. Console browser (F12)
2. Terminal Next.js
3. Supabase Dashboard (Tables + Storage)
