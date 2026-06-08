from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from listings.models import UserProfile


class Command(BaseCommand):
    help = "Créer (ou mettre à jour) un compte administrateur avec profil role=admin"

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True, help="Nom d'utilisateur admin")
        parser.add_argument("--email", required=True, help="Email admin")
        parser.add_argument("--password", required=True, help="Mot de passe admin")
        parser.add_argument("--phone", default="", help="Téléphone (optionnel)")
        parser.add_argument(
            "--superuser",
            action="store_true",
            help="Active aussi les flags Django is_superuser/is_staff",
        )

    def handle(self, *args, **options):
        username = options["username"].strip()
        email = options["email"].strip()
        password = options["password"]
        phone = options["phone"].strip()
        as_superuser = options["superuser"]

        if not username:
            raise CommandError("Le username est obligatoire")
        if not email:
            raise CommandError("L'email est obligatoire")
        if len(password) < 8:
            raise CommandError("Le mot de passe doit contenir au moins 8 caractères")

        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            username=username,
            defaults={"email": email},
        )

        user.email = email
        user.set_password(password)
        user.is_staff = True
        if as_superuser:
            user.is_superuser = True
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = UserProfile.Role.ADMIN
        if phone:
            profile.phone = phone
        profile.save()

        action = "créé" if created else "mis à jour"
        self.stdout.write(self.style.SUCCESS(f"Compte admin {action}: {username}"))
