from datetime import date

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
import uuid


class UserProfile(models.Model):
    class Role(models.TextChoices):
        CLIENT = "client", "Client"
        OWNER = "owner", "Propriétaire"
        ADMIN = "admin", "Administrateur"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.CLIENT)
    phone = models.CharField(max_length=32, blank=True)
    phone2 = models.CharField(max_length=32, blank=True)
    phone3 = models.CharField(max_length=32, blank=True)
    whatsapp_phone = models.CharField(max_length=32, blank=True)
    photo_url = models.URLField(blank=True)
    photo = models.ImageField(upload_to="profile/", blank=True, null=True)
    tax_nif = models.CharField(max_length=64, blank=True)
    tax_stat = models.CharField(max_length=64, blank=True)
    is_certified = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"


class House(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        APPROVED = "approved", "Validée"
        REJECTED = "rejected", "Refusée"

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="houses", null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    city = models.CharField(max_length=120)
    quartier = models.CharField(max_length=120)
    price = models.PositiveIntegerField()
    caution_amount = models.PositiveIntegerField(default=0)
    daily_reservation_price = models.PositiveIntegerField(default=0)
    bedrooms = models.PositiveIntegerField()
    bathrooms = models.PositiveIntegerField()
    surface = models.PositiveIntegerField()
    room_surfaces = models.JSONField(default=list, blank=True)
    image_keys = models.JSONField(default=list)
    image_urls = models.JSONField(default=list, blank=True)
    furnished = models.BooleanField(default=False)
    parking = models.BooleanField(default=False)
    water = models.BooleanField(default=True)
    electricity = models.BooleanField(default=True)
    available = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    urgent = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateField(default=date.today)
    equipments = models.JSONField(default=list)
    publication_paid = models.BooleanField(default=False)
    publication_stopped = models.BooleanField(default=False)
    publication_stopped_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    owner_phone_1 = models.CharField(max_length=32, blank=True)
    owner_phone_2 = models.CharField(max_length=32, blank=True)
    owner_phone_3 = models.CharField(max_length=32, blank=True)
    owner_whatsapp = models.CharField(max_length=32, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return self.title


class PublicationPaymentInvoice(models.Model):
    class PaymentType(models.TextChoices):
        PUBLICATION_FEE = "publication_fee", "Frais de publication"

    class PaymentMethod(models.TextChoices):
        ORANGE_MONEY = "orange_money", "Orange Money"

    class Status(models.TextChoices):
        PENDING_PAYMENT = "PENDING_PAYMENT", "Paiement en attente"
        PROOF_SUBMITTED = "PROOF_SUBMITTED", "Preuve soumise"
        UNDER_REVIEW = "UNDER_REVIEW", "En vérification"
        PAID = "PAID", "Payée"
        REJECTED = "REJECTED", "Refusée"
        CANCELLED = "CANCELLED", "Annulée"

    ORANGE_MONEY_NUMBER = "0372543764"
    ORANGE_MONEY_ACCOUNT_NAME = "Tina"

    invoice_number = models.CharField(max_length=32, unique=True)
    payment_reference = models.CharField(max_length=32, unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="publication_invoices")
    house = models.OneToOneField(House, on_delete=models.CASCADE, related_name="publication_invoice")
    payment_type = models.CharField(max_length=24, choices=PaymentType.choices, default=PaymentType.PUBLICATION_FEE)
    amount = models.PositiveIntegerField()
    currency = models.CharField(max_length=8, default="Ar")
    payment_method = models.CharField(max_length=24, choices=PaymentMethod.choices, default=PaymentMethod.ORANGE_MONEY)
    orange_money_number = models.CharField(max_length=32, default=ORANGE_MONEY_NUMBER)
    orange_money_account_name = models.CharField(max_length=120, default=ORANGE_MONEY_ACCOUNT_NAME)
    external_transaction_reference = models.CharField(max_length=120, blank=True)
    proof_image = models.ImageField(upload_to="publication-payment-proofs/", blank=True, null=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING_PAYMENT)
    admin_comment = models.TextField(blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="verified_publication_invoices", blank=True, null=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    @classmethod
    def generate_invoice_number(cls):
        return f"INV-PUB-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"

    @classmethod
    def generate_payment_reference(cls):
        return f"PAY-PUB-{uuid.uuid4().hex[:10].upper()}"

    def __str__(self) -> str:
        return f"{self.invoice_number} - {self.house.title}"


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "house")


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class VisitRequest(models.Model):
    class VisitStatus(models.TextChoices):
        PENDING = "pending", "en attente"
        ACCEPTED = "accepted", "acceptée"
        REFUSED = "refused", "refusée"
        CANCELED = "canceled", "annulée"
        DONE = "done", "visite effectuée"
        NO_SHOW = "no_show", "visite non effectuée"
        CONVERTED = "converted", "transformée en réservation"

    class DepositStatus(models.TextChoices):
        UNPAID = "unpaid", "non payée"
        PAID = "paid", "payée"
        REFUNDED = "refunded", "remboursée"
        DEDUCTED = "deducted", "déduite"
        KEPT = "kept", "conservée"

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name="visit_requests")
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name="visit_requests")
    requested_date = models.DateTimeField()
    status = models.CharField(max_length=16, choices=VisitStatus.choices, default=VisitStatus.PENDING)
    deposit_status = models.CharField(max_length=16, choices=DepositStatus.choices, default=DepositStatus.UNPAID)
    deposit_amount = models.PositiveIntegerField(default=50000)
    created_at = models.DateTimeField(auto_now_add=True)


class Reservation(models.Model):
    class ReservationStatus(models.TextChoices):
        PENDING = "pending", "en attente"
        CONFIRMED = "confirmed", "confirmée"
        CANCELED = "canceled", "annulée"
        COMPLETED = "completed", "terminée"

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reservations")
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name="reservations")
    start_date = models.DateField()
    end_date = models.DateField()
    total_price = models.PositiveIntegerField(default=0)
    commission = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=16, choices=ReservationStatus.choices, default=ReservationStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)


class PlatformSetting(models.Model):
    publication_fee = models.PositiveIntegerField(default=10000)
    reservation_commission_percent = models.PositiveIntegerField(default=10)
    visit_deposit = models.PositiveIntegerField(default=50000)
    featured_fee = models.PositiveIntegerField(default=25000)
    support_fee = models.PositiveIntegerField(default=5000)

    def __str__(self) -> str:
        return "Platform settings"
