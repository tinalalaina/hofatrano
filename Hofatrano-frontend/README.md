# Frontend (React + Vite)

## Configuration domaine de production

Créer un fichier `.env.production` à partir de l'exemple:

```bash
cp .env.production.example .env.production
```

Puis vérifier:

```env
VITE_API_URL=https://hofatrano.tina-lalaina.site/api
```

## Lancer en local

Le frontend doit pointer vers l'API Django locale pour que la connexion et l'inscription utilisent la même base de données que le backend lancé avec `python manage.py runserver`.

Créer ou vérifier `Hofatrano-frontend/.env` :

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_ALLOW_ADMIN_SIGNUP=true
```

Puis lancer :

```bash
npm install
npm run dev
```
