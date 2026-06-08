from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from listings.models import House, PlatformSetting, UserProfile

HOUSES = [
    {
        "title": "Villa moderne avec piscine à Ivandry",
        "description": "Magnifique villa moderne avec piscine, jardin tropical et vue panoramique.",
        "city": "Antananarivo",
        "quartier": "Ivandry",
        "price": 2500000,
        "bedrooms": 4,
        "bathrooms": 3,
        "surface": 250,
        "image_keys": ["house-6", "house-1", "house-4"],
        "furnished": True,
        "parking": True,
        "water": True,
        "electricity": True,
        "available": True,
        "featured": True,
        "urgent": False,
        "views": 342,
        "equipments": ["Piscine", "Jardin", "Garage", "Cuisine équipée", "WiFi"],
    },
    {
        "title": "Appartement meublé au centre-ville",
        "description": "Bel appartement entièrement meublé, lumineux et bien situé.",
        "city": "Antananarivo",
        "quartier": "Analakely",
        "price": 800000,
        "bedrooms": 2,
        "bathrooms": 1,
        "surface": 85,
        "image_keys": ["house-1", "house-4"],
        "furnished": True,
        "parking": False,
        "water": True,
        "electricity": True,
        "available": True,
        "featured": True,
        "urgent": True,
        "views": 528,
        "equipments": ["Meublé", "Cuisine équipée", "Balcon", "WiFi"],
    },
]


class Command(BaseCommand):
    help = "Seed initial houses data and default users"

    def handle(self, *args, **options):
        owner, created = User.objects.get_or_create(username="owner_demo", defaults={"email": "owner@trano.mg"})
        if created:
            owner.set_password("owner1234")
            owner.save()
        UserProfile.objects.get_or_create(user=owner, defaults={"role": UserProfile.Role.OWNER})

        client, created_client = User.objects.get_or_create(username="client_demo", defaults={"email": "client@trano.mg"})
        if created_client:
            client.set_password("client1234")
            client.save()
        UserProfile.objects.get_or_create(user=client, defaults={"role": UserProfile.Role.CLIENT})

        PlatformSetting.objects.get_or_create(id=1)

        if House.objects.exists():
            self.stdout.write(self.style.WARNING("Data already exists, skipping houses."))
            return

        House.objects.bulk_create([House(owner=owner, status=House.Status.APPROVED, publication_paid=True, **item) for item in HOUSES])
        self.stdout.write(self.style.SUCCESS(f"Inserted {len(HOUSES)} houses."))
