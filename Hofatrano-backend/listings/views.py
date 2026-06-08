from datetime import date

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import OperationalError, ProgrammingError
from django.db.models import Count, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Favorite, House, PlatformSetting, PublicationPaymentInvoice, Reservation, Review, UserProfile, VisitRequest
from .serializers import (
    FavoriteSerializer,
    HouseSerializer,
    PlatformSettingSerializer,
    PublicationInvoiceProofSubmitSerializer,
    PublicationInvoiceReviewSerializer,
    PublicationPaymentInvoiceSerializer,
    RegisterSerializer,
    ReservationSerializer,
    ReviewSerializer,
    AdminUserUpdateSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    VisitRequestSerializer,
)


def is_owner(user: User):
    return getattr(getattr(user, "profile", None), "role", "") == UserProfile.Role.OWNER


def is_admin(user: User):
    return user.is_staff or getattr(getattr(user, "profile", None), "role", "") == UserProfile.Role.ADMIN


def get_or_create_publication_invoice(house: House):
    settings = PlatformSetting.objects.first() or PlatformSetting.objects.create()
    invoice, _ = PublicationPaymentInvoice.objects.get_or_create(
        house=house,
        defaults={
            "invoice_number": PublicationPaymentInvoice.generate_invoice_number(),
            "payment_reference": PublicationPaymentInvoice.generate_payment_reference(),
            "owner": house.owner,
            "payment_type": PublicationPaymentInvoice.PaymentType.PUBLICATION_FEE,
            "amount": settings.publication_fee,
            "currency": "Ar",
            "payment_method": PublicationPaymentInvoice.PaymentMethod.ORANGE_MONEY,
            "orange_money_number": PublicationPaymentInvoice.ORANGE_MONEY_NUMBER,
            "orange_money_account_name": PublicationPaymentInvoice.ORANGE_MONEY_ACCOUNT_NAME,
            "status": PublicationPaymentInvoice.Status.PENDING_PAYMENT,
        },
    )
    return invoice


def is_house_publicly_bookable(house: House):
    return house.status == House.Status.APPROVED and house.publication_paid and not house.publication_stopped


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

    DB_SETUP_ERROR = "Base de données non initialisée. Exécutez: python manage.py migrate"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except (OperationalError, ProgrammingError):
            return Response({"detail": self.DB_SETUP_ERROR}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user, context={"request": request}).data}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def login_view(request):
    identifier = (request.data.get("username") or request.data.get("email") or request.data.get("identifier") or "").strip()
    password = request.data.get("password")

    username = identifier
    if "@" in identifier:
        user_by_email = User.objects.filter(email__iexact=identifier).first()
        if user_by_email:
            username = user_by_email.username

    user = authenticate(username=username, password=password)
    if not user:
        return Response({"detail": "Identifiants invalides"}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user, context={"request": request}).data})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"detail": "Déconnecté"})


@api_view(["GET", "PATCH"])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    if request.method == "PATCH":
        serializer = UserProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        user_fields = ["first_name", "last_name", "email"]
        for field in user_fields:
            if field in data:
                setattr(user, field, data[field])
        if any(field in data for field in user_fields):
            user.save(update_fields=[field for field in user_fields if field in data])

        profile_fields = ["phone", "phone2", "phone3", "whatsapp_phone", "tax_nif", "tax_stat"]
        for field in profile_fields:
            if field in data:
                setattr(profile, field, data[field])
        if "photo" in data:
            profile.photo = data["photo"]
        update_fields = [field for field in profile_fields if field in data]
        if "photo" in data:
            update_fields.append("photo")
            profile.photo_url = ""
            update_fields.append("photo_url")
        if update_fields:
            profile.save(update_fields=update_fields)

    return Response(UserSerializer(request.user, context={"request": request}).data)


class HouseListCreateView(generics.ListCreateAPIView):
    serializer_class = HouseSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = House.objects.filter(status=House.Status.APPROVED, publication_paid=True, publication_stopped=False)
        params = self.request.query_params

        city = params.get("city")
        quartier = params.get("quartier")
        min_price = params.get("minPrice")
        max_price = params.get("maxPrice")
        bedrooms = params.get("bedrooms")

        if city:
            queryset = queryset.filter(city=city)
        if quartier:
            queryset = queryset.filter(quartier=quartier)
        if min_price and min_price.isdigit():
            queryset = queryset.filter(price__gte=int(min_price))
        if max_price and max_price.isdigit():
            queryset = queryset.filter(price__lte=int(max_price))
        if bedrooms and bedrooms.isdigit():
            queryset = queryset.filter(bedrooms__gte=int(bedrooms))

        for bool_field in ["furnished", "parking", "water", "electricity", "available", "featured", "urgent"]:
            if params.get(bool_field) == "true":
                queryset = queryset.filter(**{bool_field: True})

        return queryset

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated or not is_owner(self.request.user):
            raise permissions.PermissionDenied("Compte propriétaire requis.")
        house = serializer.save(owner=self.request.user)
        get_or_create_publication_invoice(house)


class HouseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HouseSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (is_admin(user) or is_owner(user)):
            return House.objects.all()
        return House.objects.filter(status=House.Status.APPROVED, publication_paid=True, publication_stopped=False)

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        house = self.get_object()
        if house.owner_id != request.user.id and not is_admin(request.user):
            return Response({"detail": "Non autorisé"}, status=403)
        serializer = self.get_serializer(house, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        house = self.get_object()
        if house.owner_id != request.user.id and not is_admin(request.user):
            return Response({"detail": "Non autorisé"}, status=403)
        house.delete()
        return Response(status=204)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_or_get_publication_invoice(request, house_id: int):
    house = House.objects.get(pk=house_id)
    if house.owner_id != request.user.id and not is_admin(request.user):
        return Response({"detail": "Non autorisé"}, status=403)
    invoice = get_or_create_publication_invoice(house)
    return Response(PublicationPaymentInvoiceSerializer(invoice, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def owner_stop_house_publication(request, house_id: int):
    house = House.objects.select_related("publication_invoice").get(pk=house_id)
    if house.owner_id != request.user.id:
        return Response({"detail": "Non autorisé"}, status=403)

    password = (request.data.get("password") or "").strip()
    if not password:
        return Response({"detail": "Mot de passe requis"}, status=400)
    if not request.user.check_password(password):
        return Response({"detail": "Mot de passe invalide"}, status=400)

    house.publication_stopped = True
    house.publication_stopped_at = timezone.now()
    house.publication_paid = False
    house.available = False
    house.save(update_fields=["publication_stopped", "publication_stopped_at", "publication_paid", "available"])

    invoice = PublicationPaymentInvoice.objects.filter(house=house).first()
    if invoice:
        settings = PlatformSetting.objects.first() or PlatformSetting.objects.create()
        invoice.invoice_number = PublicationPaymentInvoice.generate_invoice_number()
        invoice.payment_reference = PublicationPaymentInvoice.generate_payment_reference()
        invoice.amount = settings.publication_fee
        invoice.external_transaction_reference = ""
        invoice.proof_image = None
        invoice.status = PublicationPaymentInvoice.Status.PENDING_PAYMENT
        invoice.admin_comment = "Publication arrêtée par le propriétaire. Nouveau paiement requis pour republier."
        invoice.verified_by = None
        invoice.verified_at = None
        invoice.save(
            update_fields=[
                "invoice_number",
                "payment_reference",
                "amount",
                "external_transaction_reference",
                "proof_image",
                "status",
                "admin_comment",
                "verified_by",
                "verified_at",
                "updated_at",
            ]
        )
    return Response(HouseSerializer(house).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def owner_publication_invoice_detail(request, invoice_id: int):
    invoice = PublicationPaymentInvoice.objects.select_related("owner", "house", "verified_by").get(pk=invoice_id)
    if invoice.owner_id != request.user.id and not is_admin(request.user):
        return Response({"detail": "Non autorisé"}, status=403)
    return Response(PublicationPaymentInvoiceSerializer(invoice, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def owner_publication_invoices(request):
    invoices = PublicationPaymentInvoice.objects.select_related("owner", "house", "verified_by").filter(owner=request.user)
    return Response(PublicationPaymentInvoiceSerializer(invoices, many=True, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def submit_publication_invoice_proof(request, invoice_id: int):
    invoice = PublicationPaymentInvoice.objects.get(pk=invoice_id)
    if invoice.owner_id != request.user.id:
        return Response({"detail": "Non autorisé"}, status=403)
    if invoice.status in [PublicationPaymentInvoice.Status.PAID, PublicationPaymentInvoice.Status.CANCELLED]:
        return Response({"detail": "Statut ne permet pas la modification."}, status=400)

    serializer = PublicationInvoiceProofSubmitSerializer(invoice, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save(
        status=PublicationPaymentInvoice.Status.PROOF_SUBMITTED,
        admin_comment="",
        verified_by=None,
        verified_at=None,
    )
    return Response(PublicationPaymentInvoiceSerializer(invoice, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def download_publication_invoice_pdf(request, invoice_id: int):
    invoice = PublicationPaymentInvoice.objects.select_related("owner", "house").get(pk=invoice_id)
    if invoice.owner_id != request.user.id and not is_admin(request.user):
        return Response({"detail": "Non autorisé"}, status=403)

    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
    except ModuleNotFoundError:
        return Response(
            {"detail": "La génération PDF nécessite le package reportlab. Exécutez: pip install -r requirements.txt"},
            status=503,
        )

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{invoice.invoice_number}.pdf"'

    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4

    p.setFillColor(colors.HexColor("#0f172a"))
    p.rect(0, height - 45 * mm, width, 45 * mm, fill=1, stroke=0)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 18)
    p.drawString(18 * mm, height - 20 * mm, "FACTURE DE PAIEMENT")
    p.setFont("Helvetica", 10)
    p.drawString(18 * mm, height - 28 * mm, f"Numéro: {invoice.invoice_number}")
    p.drawString(18 * mm, height - 34 * mm, f"Référence paiement: {invoice.payment_reference}")

    y = height - 56 * mm
    p.setFillColor(colors.black)
    p.setFont("Helvetica-Bold", 11)
    p.drawString(18 * mm, y, "Informations")
    y -= 8 * mm

    lines = [
        f"Date: {timezone.localtime(invoice.created_at).strftime('%d/%m/%Y %H:%M')}",
        f"Statut: {invoice.status}",
        f"Propriétaire: {(invoice.owner.first_name + ' ' + invoice.owner.last_name).strip() or invoice.owner.username}",
        f"Téléphone: {getattr(getattr(invoice.owner, 'profile', None), 'phone', '-')}",
        f"Email: {invoice.owner.email or '-'}",
        f"Maison: {invoice.house.title}",
        f"Ville / Quartier: {invoice.house.city} / {invoice.house.quartier}",
        f"Référence maison: HOUSE-{invoice.house_id}",
        f"Type paiement: Frais de publication",
        f"Montant: {invoice.amount} {invoice.currency}",
        f"Méthode: Orange Money",
        f"Numéro Orange Money: {invoice.orange_money_number}",
        f"Nom du compte: {invoice.orange_money_account_name}",
        f"Référence transaction externe: {invoice.external_transaction_reference or '-'}",
    ]

    p.setFont("Helvetica", 10)
    for line in lines:
        p.drawString(18 * mm, y, line)
        y -= 6 * mm

    y -= 2 * mm
    p.setFont("Helvetica-Bold", 11)
    p.drawString(18 * mm, y, "Instructions")
    y -= 7 * mm
    p.setFont("Helvetica", 10)
    instructions = [
        "1) Envoyez le paiement via Orange Money au 0372543764.",
        "2) Vérifiez que le nom affiché est Tina.",
        "3) Ajoutez la référence de transaction après paiement.",
        "4) Envoyez la preuve de paiement pour vérification.",
        "5) La publication est validée seulement après confirmation admin.",
    ]
    for line in instructions:
        p.drawString(20 * mm, y, line)
        y -= 6 * mm

    p.showPage()
    p.save()
    return response


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_publication_invoice_list(request):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)
    invoices = PublicationPaymentInvoice.objects.select_related("owner", "house", "verified_by").all()
    return Response(PublicationPaymentInvoiceSerializer(invoices, many=True, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def admin_publication_invoice_mark_under_review(request, invoice_id: int):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)
    invoice = PublicationPaymentInvoice.objects.select_related("house").get(pk=invoice_id)
    invoice.status = PublicationPaymentInvoice.Status.UNDER_REVIEW
    invoice.save(update_fields=["status", "updated_at"])
    return Response(PublicationPaymentInvoiceSerializer(invoice, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def admin_publication_invoice_review(request, invoice_id: int):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)

    invoice = PublicationPaymentInvoice.objects.select_related("house").get(pk=invoice_id)
    serializer = PublicationInvoiceReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    reviewed_status = serializer.validated_data["status"]
    admin_comment = serializer.validated_data.get("admin_comment", "")

    invoice.status = reviewed_status
    invoice.admin_comment = admin_comment
    invoice.verified_by = request.user
    invoice.verified_at = timezone.now()

    if reviewed_status == PublicationPaymentInvoice.Status.PAID:
        invoice.house.publication_paid = True
        invoice.house.save(update_fields=["publication_paid"])
    elif reviewed_status == PublicationPaymentInvoice.Status.REJECTED:
        invoice.house.publication_paid = False
        invoice.house.save(update_fields=["publication_paid"])

    invoice.save(update_fields=["status", "admin_comment", "verified_by", "verified_at", "updated_at"])
    return Response(PublicationPaymentInvoiceSerializer(invoice, context={"request": request}).data)


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(house_id=self.kwargs["house_id"]).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, house_id=self.kwargs["house_id"])


class FavoriteListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related("house")


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_favorite(request, favorite_id: int):
    deleted_count, _ = Favorite.objects.filter(id=favorite_id, user=request.user).delete()
    if deleted_count == 0:
        return Response({"detail": "Favori introuvable"}, status=404)
    return Response(status=204)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def toggle_favorite(request, house_id: int):
    favorite, created = Favorite.objects.get_or_create(user=request.user, house_id=house_id)
    if not created:
        favorite.delete()
    return Response({"favorited": created})


class VisitRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VisitRequestSerializer

    def get_queryset(self):
        return VisitRequest.objects.filter(client=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        setting = PlatformSetting.objects.first() or PlatformSetting.objects.create()
        serializer.save(client=self.request.user, deposit_amount=setting.visit_deposit)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_visit(request, visit_id: int):
    deleted_count, _ = VisitRequest.objects.filter(id=visit_id, client=request.user).delete()
    if deleted_count == 0:
        return Response({"detail": "Visite introuvable"}, status=404)
    return Response(status=204)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_visit(request, visit_id: int):
    visit = VisitRequest.objects.filter(id=visit_id, client=request.user).first()
    if not visit:
        return Response({"detail": "Visite introuvable"}, status=404)
    if visit.status in [VisitRequest.VisitStatus.DONE, VisitRequest.VisitStatus.CONVERTED]:
        return Response({"detail": "Une visite terminée ou convertie ne peut pas être annulée"}, status=400)
    visit.status = VisitRequest.VisitStatus.CANCELED
    if visit.deposit_status == VisitRequest.DepositStatus.PAID:
        visit.deposit_status = VisitRequest.DepositStatus.REFUNDED
    visit.save(update_fields=["status", "deposit_status"])
    return Response(VisitRequestSerializer(visit).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def pay_visit_deposit(request, visit_id: int):
    visit = VisitRequest.objects.filter(pk=visit_id, client=request.user).first()
    if not visit:
        return Response({"detail": "Visite introuvable"}, status=404)
    visit.deposit_status = VisitRequest.DepositStatus.PAID
    visit.save(update_fields=["deposit_status"])
    return Response(VisitRequestSerializer(visit).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def owner_visit_action(request, visit_id: int):
    visit = VisitRequest.objects.select_related("house").filter(pk=visit_id).first()
    if not visit:
        return Response({"detail": "Visite introuvable"}, status=404)
    if visit.house.owner_id != request.user.id:
        return Response({"detail": "Non autorisé"}, status=403)
    action = request.data.get("action")
    if action == "accept":
        visit.status = VisitRequest.VisitStatus.ACCEPTED
    elif action == "refuse":
        visit.status = VisitRequest.VisitStatus.REFUSED
    elif action == "cancel":
        visit.status = VisitRequest.VisitStatus.CANCELED
        visit.deposit_status = VisitRequest.DepositStatus.REFUNDED
    elif action == "done":
        visit.status = VisitRequest.VisitStatus.DONE
    elif action == "no_show":
        visit.status = VisitRequest.VisitStatus.NO_SHOW
        visit.deposit_status = VisitRequest.DepositStatus.KEPT
    elif action == "update_deposit_status":
        deposit_status = request.data.get("deposit_status")
        valid_statuses = {
            VisitRequest.DepositStatus.UNPAID,
            VisitRequest.DepositStatus.PAID,
            VisitRequest.DepositStatus.REFUNDED,
            VisitRequest.DepositStatus.DEDUCTED,
            VisitRequest.DepositStatus.KEPT,
        }
        if deposit_status not in valid_statuses:
            return Response({"detail": "Statut de paiement invalide"}, status=400)
        visit.deposit_status = deposit_status
    elif action == "update_status":
        status_value = request.data.get("status")
        valid_statuses = {
            VisitRequest.VisitStatus.PENDING,
            VisitRequest.VisitStatus.ACCEPTED,
            VisitRequest.VisitStatus.REFUSED,
            VisitRequest.VisitStatus.CANCELED,
            VisitRequest.VisitStatus.DONE,
            VisitRequest.VisitStatus.NO_SHOW,
        }
        if status_value not in valid_statuses:
            return Response({"detail": "Statut de visite invalide"}, status=400)
        visit.status = status_value
    else:
        return Response({"detail": "Action invalide"}, status=400)
    visit.save()
    return Response(VisitRequestSerializer(visit).data)


class ReservationListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReservationSerializer

    def get_queryset(self):
        return Reservation.objects.filter(client=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        house = House.objects.get(pk=self.request.data.get("house"))
        if not is_house_publicly_bookable(house):
            raise permissions.PermissionDenied("Cette maison n'est plus réservable.")
        start_date = date.fromisoformat(self.request.data.get("start_date"))
        end_date = date.fromisoformat(self.request.data.get("end_date"))
        days = max((end_date - start_date).days, 1)
        subtotal = house.price * days
        setting = PlatformSetting.objects.first() or PlatformSetting.objects.create()
        commission = int((setting.reservation_commission_percent / 100) * subtotal)

        visit = VisitRequest.objects.filter(
            client=self.request.user,
            house=house,
            status=VisitRequest.VisitStatus.DONE,
            deposit_status=VisitRequest.DepositStatus.PAID,
        ).order_by("-created_at").first()

        total = subtotal + commission
        if visit:
            total = max(total - visit.deposit_amount, 0)
            visit.status = VisitRequest.VisitStatus.CONVERTED
            visit.deposit_status = VisitRequest.DepositStatus.DEDUCTED
            visit.save(update_fields=["status", "deposit_status"])

        serializer.save(client=self.request.user, total_price=total, commission=commission, status=Reservation.ReservationStatus.PENDING)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_reservation(request, reservation_id: int):
    deleted_count, _ = Reservation.objects.filter(id=reservation_id, client=request.user).delete()
    if deleted_count == 0:
        return Response({"detail": "Réservation introuvable"}, status=404)
    return Response(status=204)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_reservation(request, reservation_id: int):
    reservation = Reservation.objects.filter(id=reservation_id, client=request.user).first()
    if not reservation:
        return Response({"detail": "Réservation introuvable"}, status=404)
    if reservation.status == Reservation.ReservationStatus.COMPLETED:
        return Response({"detail": "Une réservation terminée ne peut pas être annulée"}, status=400)
    reservation.status = Reservation.ReservationStatus.CANCELED
    reservation.save(update_fields=["status"])
    return Response(ReservationSerializer(reservation, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def owner_reservation_action(request, reservation_id: int):
    reservation = Reservation.objects.select_related("house").filter(pk=reservation_id).first()
    if not reservation:
        return Response({"detail": "Réservation introuvable"}, status=404)
    if reservation.house.owner_id != request.user.id:
        return Response({"detail": "Non autorisé"}, status=403)

    action = request.data.get("action")
    if action == "confirm":
        reservation.status = Reservation.ReservationStatus.CONFIRMED
    elif action == "cancel":
        reservation.status = Reservation.ReservationStatus.CANCELED
    elif action == "complete":
        reservation.status = Reservation.ReservationStatus.COMPLETED
    elif action == "update_status":
        status_value = request.data.get("status")
        valid_statuses = {
            Reservation.ReservationStatus.PENDING,
            Reservation.ReservationStatus.CONFIRMED,
            Reservation.ReservationStatus.CANCELED,
            Reservation.ReservationStatus.COMPLETED,
        }
        if status_value not in valid_statuses:
            return Response({"detail": "Statut réservation invalide"}, status=400)
        reservation.status = status_value
    else:
        return Response({"detail": "Action invalide"}, status=400)

    reservation.save(update_fields=["status"])
    return Response(ReservationSerializer(reservation, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def owner_dashboard(request):
    if not is_owner(request.user):
        return Response({"detail": "Compte propriétaire requis"}, status=403)
    houses = House.objects.filter(owner=request.user)
    visits = VisitRequest.objects.filter(house__owner=request.user)
    reservations = Reservation.objects.filter(house__owner=request.user)
    invoices = PublicationPaymentInvoice.objects.select_related("house").filter(owner=request.user)
    data = {
        "houses": HouseSerializer(houses, many=True).data,
        "visits": VisitRequestSerializer(visits.order_by("-created_at"), many=True, context={"request": request}).data,
        "reservations": ReservationSerializer(reservations.order_by("-created_at"), many=True, context={"request": request}).data,
        "publication_invoices": PublicationPaymentInvoiceSerializer(invoices, many=True, context={"request": request}).data,
        "stats": {
            "houses_total": houses.count(),
            "visits_pending": visits.filter(status=VisitRequest.VisitStatus.PENDING).count(),
            "reservations_confirmed": reservations.filter(status=Reservation.ReservationStatus.CONFIRMED).count(),
            "revenue_total": reservations.aggregate(total=Sum("total_price"))["total"] or 0,
        },
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_dashboard(request):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)

    settings = PlatformSetting.objects.first() or PlatformSetting.objects.create()
    reservations = Reservation.objects.all()
    visits = VisitRequest.objects.all()
    invoices = PublicationPaymentInvoice.objects.select_related("house", "owner", "verified_by").all()

    data = {
        "users": UserSerializer(User.objects.all(), many=True, context={"request": request}).data,
        "houses": HouseSerializer(House.objects.all(), many=True).data,
        "visits": VisitRequestSerializer(visits.order_by("-created_at"), many=True, context={"request": request}).data,
        "reservations": ReservationSerializer(reservations.order_by("-created_at"), many=True, context={"request": request}).data,
        "publication_invoices": PublicationPaymentInvoiceSerializer(invoices, many=True, context={"request": request}).data,
        "settings": PlatformSettingSerializer(settings).data,
        "stats": {
            "total_users": User.objects.count(),
            "total_houses": House.objects.count(),
            "pending_houses": House.objects.filter(status=House.Status.PENDING).count(),
            "pending_publication_invoices": invoices.exclude(status=PublicationPaymentInvoice.Status.PAID).count(),
            "platform_revenue": (reservations.aggregate(total=Sum("commission"))["total"] or 0)
            + (visits.filter(deposit_status=VisitRequest.DepositStatus.KEPT).aggregate(total=Sum("deposit_amount"))["total"] or 0),
            "top_cities": list(House.objects.values("city").annotate(total=Count("id")).order_by("-total")[:5]),
        },
    }
    return Response(data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def admin_validate_house(request, house_id: int):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)
    house = House.objects.get(pk=house_id)
    status_value = request.data.get("status")
    if status_value not in [House.Status.APPROVED, House.Status.REJECTED, House.Status.PENDING]:
        return Response({"detail": "Statut invalide"}, status=400)
    if status_value == House.Status.APPROVED and not house.publication_paid:
        return Response({"detail": "Impossible de publier: paiement de publication non validé."}, status=400)
    house.status = status_value
    update_fields = ["status"]
    if status_value == House.Status.APPROVED:
        house.publication_stopped = False
        house.available = True
        update_fields.extend(["publication_stopped", "available"])
    house.save(update_fields=update_fields)
    return Response(HouseSerializer(house).data)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def admin_update_settings(request):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)
    settings = PlatformSetting.objects.first() or PlatformSetting.objects.create()
    serializer = PlatformSettingSerializer(settings, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_user_detail(request, user_id: int):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)
    target = User.objects.get(pk=user_id)
    return Response(UserSerializer(target, context={"request": request}).data)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def admin_user_update(request, user_id: int):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)
    target = User.objects.get(pk=user_id)
    serializer = AdminUserUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user_fields = ["first_name", "last_name"]
    for field in user_fields:
        if field in data:
            setattr(target, field, data[field])
    if any(field in data for field in user_fields):
        target.save(update_fields=[field for field in user_fields if field in data])

    profile, _ = UserProfile.objects.get_or_create(user=target)
    profile_fields = ["phone", "phone2", "phone3", "whatsapp_phone"]
    updated_fields = []
    for field in profile_fields:
        if field in data:
            setattr(profile, field, data[field])
            updated_fields.append(field)
    if updated_fields:
        profile.save(update_fields=updated_fields)

    return Response(UserSerializer(target, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def admin_user_toggle_certified(request, user_id: int):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)
    target = User.objects.get(pk=user_id)
    profile, _ = UserProfile.objects.get_or_create(user=target)
    profile.is_certified = not profile.is_certified
    profile.save(update_fields=["is_certified"])
    return Response(UserSerializer(target, context={"request": request}).data)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def admin_user_delete(request, user_id: int):
    if not is_admin(request.user):
        return Response({"detail": "Compte admin requis"}, status=403)
    if request.user.id == user_id:
        return Response({"detail": "Suppression de votre compte admin interdite"}, status=400)
    target = User.objects.get(pk=user_id)
    target.delete()
    return Response(status=204)
