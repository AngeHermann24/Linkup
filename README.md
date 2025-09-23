# Linkup - Plateforme de Services

Linkup est une plateforme moderne qui connecte les clients avec des prestataires de services qualifiés. L'application permet aux utilisateurs de réserver des services facilement et aux prestataires de gérer leur activité.

## 📱 Optimisation Mobile
L'application est entièrement optimisée pour mobile avec un design responsive et un menu hamburger intuitif.

## 🚀 Fonctionnalités

### Pour les Clients
- Recherche et réservation de services
- Tableau de bord personnalisé
- Historique des services
- Système d'avis et de notation

### Pour les Prestataires
- Profil professionnel complet
- Gestion des services et tarifs
- Planning et disponibilités
- Statistiques et revenus

### Services Disponibles

#### Services Basiques
- Toclo Toclo
- Fanicko
- Technicien de surface
- Peintre
- Jardinier

#### Services Pro
- Mécanicien
- Plombier
- Électricien
- Coiffeuse
- Traiteur
- Maquilleuse
- Pâtissier

## 🛠️ Technologies Utilisées

- **Frontend**: React 18 + TypeScript
- **Routage**: React Router DOM
- **Authentification**: Supabase Auth
- **Base de données**: Supabase (PostgreSQL)
- **Styling**: CSS3 avec animations
- **Build Tool**: Vite

## 📦 Installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd Linkup
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Supabase**
   - Créez un projet sur [Supabase](https://supabase.com)
   - Copiez l'URL et la clé anonyme
   - Créez un fichier `.env` avec :
     ```
     VITE_SUPABASE_URL=votre_url_supabase
     VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
     ```

4. **Configurer la base de données**
   - Ouvrez l'éditeur SQL dans Supabase
   - Exécutez le script `supabase-setup.sql`

5. **Lancer l'application**
   ```bash
   npm run dev
   ```

## 🗄️ Structure de la Base de Données

### Table `profiles`
```sql
- id (UUID, clé primaire, référence auth.users)
- email (TEXT, unique)
- full_name (TEXT)
- phone (TEXT)
- role ('client' | 'prestataire')
- service_type ('basique' | 'pro')
- service_category (TEXT)
- avatar_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔐 Authentification

L'application utilise Supabase Auth avec :
- Inscription par email/mot de passe
- Choix du rôle (client/prestataire)
- Sélection des services pour les prestataires
- Redirection automatique selon le rôle

## 🎨 Design

- Interface moderne et responsive
- Animations CSS fluides
- Effets 3D sur les cartes
- Palette de couleurs cohérente (bleu/violet)
- Optimisé pour mobile et desktop

## 📱 Pages Principales

1. **Page d'accueil** (`/`)
   - Landing page avec présentation
   - Sections : Héros, Comment ça marche, Catégories, Tarifs, Témoignages

2. **Connexion** (`/login`)
   - Formulaire de connexion
   - Redirection automatique selon le rôle

3. **Inscription** (`/register`)
   - Processus en 3 étapes
   - Choix du rôle et des services

4. **Dashboard Client** (`/dashboard/client`)
   - Vue d'ensemble des services
   - Réservations (à venir)

5. **Dashboard Prestataire** (`/dashboard/prestataire`)
   - Statistiques et revenus
   - Gestion des services (à venir)

## 🚧 Fonctionnalités à Venir

- [ ] Système de réservation complet
- [ ] Chat en temps réel
- [ ] Paiement intégré
- [ ] Géolocalisation
- [ ] Notifications push
- [ ] Application mobile
- [ ] Système d'avis avancé
- [ ] Programme de fidélité

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 📞 Support

Pour toute question ou support, contactez : angeherboua@gmail.com

---

**Linkup** - Connecter les talents, simplifier les services 🔗
