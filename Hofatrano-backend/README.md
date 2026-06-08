# Backend (Django) - Configuration PostgreSQL locale (Linux Mint)

## 1) Installer PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```

Vérifier que le service tourne :

```bash
sudo systemctl status postgresql
```

## 2) Créer la base de données et l'utilisateur

Ouvrir le shell PostgreSQL avec l'utilisateur système `postgres` :

```bash
sudo -u postgres psql
```

Puis exécuter :

```sql
CREATE DATABASE gasycar;
CREATE USER gasycar_user WITH ENCRYPTED PASSWORD 'ChangeMoi123!';
GRANT ALL PRIVILEGES ON DATABASE gasycar TO gasycar_user;
\q
```

## 3) Configurer les variables d'environnement Django

Dans `backend/.env`, mettre :

```env
DJANGO_SECRET_KEY=django-insecure-local-dev-only
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=hofatrano.tina-lalaina.site,tina-lalaina.site,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://hofatrano.tina-lalaina.site,https://tina-lalaina.site,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080
CSRF_TRUSTED_ORIGINS=https://hofatrano.tina-lalaina.site,https://tina-lalaina.site,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080

DB_ENGINE=postgresql
DB_NAME=gasycar
DB_USER=gasycar_user
DB_PASSWORD=ChangeMoi123!
DB_HOST=127.0.0.1
DB_PORT=5432
```

## 4) Installer les dépendances Python

Depuis `backend/` :

```bash
python -m pip install -r requirements.txt
```

## 5) Appliquer les migrations

```bash
python manage.py migrate
```

## 6) Lancer le serveur

```bash
python manage.py runserver
```

## 7) Vérifier la connexion PostgreSQL

Optionnel :

```bash
python manage.py dbshell
```

Si la connexion fonctionne, vous verrez le prompt PostgreSQL.
