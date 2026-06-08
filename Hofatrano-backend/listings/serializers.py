import uuid

from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import Favorite, House, PlatformSetting, PublicationPaymentInvoice, Reservation, Review, UserProfile, VisitRequest


class RegisterSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserProfile.Role.choices, default=UserProfile.Role.CLIENT)
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    photo_url = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "role", "phone", "photo_url"]

    def validate_username(self, value):
        normalized_value = value.strip()
        if User.objects.filter(username__iexact=normalized_value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return normalized_value

    def validate_email(self, value):
        normalized_value = value.strip()
        if not normalized_value:
            return normalized_value
        if User.objects.filter(email__iexact=normalized_value).exists():
            raise serializers.ValidationError("Cette adresse e-mail est déjà utilisée.")
        return normalized_value

    def create(self, validated_data):
        role = validated_data.pop("role", UserProfile.Role.CLIENT)
        phone = validated_data.pop("phone", "")
        photo_url = validated_data.pop("photo_url", "")
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, role=role, phone=phone, photo_url=photo_url)
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    phone2 = serializers.SerializerMethodField()
    phone3 = serializers.SerializerMethodField()
    whatsapp_phone = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    tax_nif = serializers.SerializerMethodField()
    tax_stat = serializers.SerializerMethodField()
    is_certified = serializers.SerializerMethodField()
    verification_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "role",
            "phone", "phone2", "phone3", "whatsapp_phone",
            "photo_url", "tax_nif", "tax_stat", "is_certified", "verification_status",
        ]

    def _get_profile(self, obj):
        try:
            return obj.profile
        except ObjectDoesNotExist:
            return None

    def get_role(self, obj):
        profile = self._get_profile(obj)
        return getattr(profile, "role", UserProfile.Role.CLIENT)

    def get_phone(self, obj):
        profile = self._get_profile(obj)
        return getattr(profile, "phone", "")

    def get_photo_url(self, obj):
        profile = self._get_profile(obj)
        if profile and getattr(profile, "photo", None):
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(profile.photo.url)
            return profile.photo.url
        return getattr(profile, "photo_url", "")

    def get_phone2(self, obj):
        profile = self._get_profile(obj)
        return getattr(profile, "phone2", "")

    def get_phone3(self, obj):
        profile = self._get_profile(obj)
        return getattr(profile, "phone3", "")

    def get_whatsapp_phone(self, obj):
        profile = self._get_profile(obj)
        return getattr(profile, "whatsapp_phone", "")

    def get_tax_nif(self, obj):
        profile = self._get_profile(obj)
        return getattr(profile, "tax_nif", "")

    def get_tax_stat(self, obj):
        profile = self._get_profile(obj)
        return getattr(profile, "tax_stat", "")

    def get_is_certified(self, obj):
        profile = self._get_profile(obj)
        return bool(getattr(profile, "is_certified", False))

    def get_verification_status(self, obj):
        return "VERIFIED" if self.get_is_certified(obj) else "PENDING"


class UserProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    phone2 = serializers.CharField(required=False, allow_blank=True, max_length=32)
    phone3 = serializers.CharField(required=False, allow_blank=True, max_length=32)
    whatsapp_phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    photo = serializers.ImageField(required=False)
    tax_nif = serializers.CharField(required=False, allow_blank=True, max_length=64)
    tax_stat = serializers.CharField(required=False, allow_blank=True, max_length=64)


class AdminUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    phone2 = serializers.CharField(required=False, allow_blank=True, max_length=32)
    phone3 = serializers.CharField(required=False, allow_blank=True, max_length=32)
    whatsapp_phone = serializers.CharField(required=False, allow_blank=True, max_length=32)


class HouseSerializer(serializers.ModelSerializer):
    ownerName = serializers.SerializerMethodField()
    ownerPhone = serializers.SerializerMethodField()
    ownerPhone1 = serializers.CharField(source="owner_phone_1", read_only=True)
    ownerPhone2 = serializers.CharField(source="owner_phone_2", read_only=True)
    ownerPhone3 = serializers.CharField(source="owner_phone_3", read_only=True)
    ownerWhatsapp = serializers.CharField(source="owner_whatsapp", read_only=True)
    ownerPhoto = serializers.SerializerMethodField()
    ownerPhone1Input = serializers.CharField(required=False, allow_blank=True, write_only=True)
    ownerPhone2Input = serializers.CharField(required=False, allow_blank=True, write_only=True)
    ownerPhone3Input = serializers.CharField(required=False, allow_blank=True, write_only=True)
    ownerWhatsappInput = serializers.CharField(required=False, allow_blank=True, write_only=True)
    image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    image_keys = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    image_urls = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    image_files = serializers.ListField(child=serializers.ImageField(), required=False, write_only=True)
    room_surfaces = serializers.ListField(child=serializers.IntegerField(min_value=1), required=False)
    reviewCount = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = House
        fields = [
            "id", "title", "description", "city", "quartier", "price", "caution_amount", "daily_reservation_price", "bedrooms", "bathrooms", "surface", "room_surfaces",
            "image", "images", "image_keys", "image_urls", "image_files", "furnished", "parking", "water", "electricity", "available", "featured", "urgent",
            "views", "ownerName", "ownerPhone", "ownerPhone1", "ownerPhone2", "ownerPhone3", "ownerWhatsapp", "ownerPhoto", "ownerPhone1Input", "ownerPhone2Input", "ownerPhone3Input", "ownerWhatsappInput", "created_at", "equipments", "rating", "reviewCount", "status", "publication_paid", "publication_stopped", "publication_stopped_at",
        ]
        extra_kwargs = {
            "image_keys": {"write_only": True, "required": False},
            "image_urls": {"write_only": True, "required": False},
            "image_files": {"write_only": True, "required": False},
            "publication_stopped_at": {"read_only": True},
        }

    def validate(self, attrs):
        attrs = super().validate(attrs)
        room_surfaces = attrs.get("room_surfaces")
        bedrooms = attrs.get("bedrooms")

        if room_surfaces is None and self.instance is not None:
            room_surfaces = self.instance.room_surfaces
        if bedrooms is None and self.instance is not None:
            bedrooms = self.instance.bedrooms

        if room_surfaces and bedrooms is not None and len(room_surfaces) > bedrooms:
            raise serializers.ValidationError({"room_surfaces": "Le nombre de surfaces ne peut pas dépasser le nombre de chambres."})

        return attrs

    def get_ownerName(self, obj: House):
        return obj.owner.username if obj.owner else "Propriétaire"

    def get_ownerPhone(self, obj: House):
        phones = [obj.owner_phone_1, obj.owner_phone_2, obj.owner_phone_3]
        return " / ".join([phone for phone in phones if phone])


    def get_ownerPhoto(self, obj: House):
        return getattr(getattr(obj.owner, "profile", None), "photo_url", "") if obj.owner else ""

    def get_image(self, obj: House):
        if obj.image_urls:
            return obj.image_urls[0]
        return obj.image_keys[0] if obj.image_keys else ""

    def get_images(self, obj: House):
        if obj.image_urls:
            return obj.image_urls
        return obj.image_keys or []

    def get_reviewCount(self, obj: House):
        return obj.reviews.count()

    def get_rating(self, obj: House):
        values = list(obj.reviews.values_list("rating", flat=True))
        return round(sum(values) / len(values), 1) if values else 0

    def _get_uploaded_files(self):
        request = self.context.get("request")
        if not request:
            return []
        return request.FILES.getlist("photos") or request.FILES.getlist("image_files")

    def _save_uploaded_images(self, files):
        saved_urls = []
        for file in files:
            extension = (file.name.split(".")[-1] or "jpg").lower()
            filename = f"houses/{uuid.uuid4().hex}.{extension}"
            stored_name = default_storage.save(filename, file)
            saved_urls.append(default_storage.url(stored_name))
        return saved_urls

    def _extract_owner_contacts(self, validated_data):
        phone1 = validated_data.pop("ownerPhone1Input", None)
        phone2 = validated_data.pop("ownerPhone2Input", None)
        phone3 = validated_data.pop("ownerPhone3Input", None)
        whatsapp = validated_data.pop("ownerWhatsappInput", None)
        return phone1, phone2, phone3, whatsapp

    def _apply_owner_contacts(self, house, contacts):
        phone1, phone2, phone3, whatsapp = contacts
        updates = {}
        if phone1 is not None:
            updates["owner_phone_1"] = phone1
        if phone2 is not None:
            updates["owner_phone_2"] = phone2
        if phone3 is not None:
            updates["owner_phone_3"] = phone3
        if whatsapp is not None:
            updates["owner_whatsapp"] = whatsapp
        for key, value in updates.items():
            setattr(house, key, value)
        return bool(updates)

    def create(self, validated_data):
        contacts = self._extract_owner_contacts(validated_data)
        validated_data.pop("image_files", None)
        uploaded_files = self._get_uploaded_files()
        if uploaded_files:
            validated_data["image_urls"] = self._save_uploaded_images(uploaded_files)
            validated_data["image_keys"] = []
        house = super().create(validated_data)
        if self._apply_owner_contacts(house, contacts):
            house.save(update_fields=["owner_phone_1", "owner_phone_2", "owner_phone_3", "owner_whatsapp"])
        return house

    def update(self, instance, validated_data):
        contacts = self._extract_owner_contacts(validated_data)
        validated_data.pop("image_files", None)
        uploaded_files = self._get_uploaded_files()
        if uploaded_files:
            existing_urls = validated_data.get("image_urls", instance.image_urls)
            new_urls = self._save_uploaded_images(uploaded_files)
            validated_data["image_urls"] = [*existing_urls, *new_urls]
            validated_data["image_keys"] = []
        house = super().update(instance, validated_data)
        if self._apply_owner_contacts(house, contacts):
            house.save(update_fields=["owner_phone_1", "owner_phone_2", "owner_phone_3", "owner_whatsapp"])
        return house


class PublicationPaymentInvoiceSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    owner_phone = serializers.SerializerMethodField()
    owner_email = serializers.SerializerMethodField()
    house_title = serializers.CharField(source="house.title", read_only=True)
    house_city = serializers.CharField(source="house.city", read_only=True)
    house_quartier = serializers.CharField(source="house.quartier", read_only=True)
    house_reference = serializers.SerializerMethodField()
    proof_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PublicationPaymentInvoice
        fields = [
            "id",
            "invoice_number",
            "payment_reference",
            "owner",
            "owner_name",
            "owner_phone",
            "owner_email",
            "house",
            "house_title",
            "house_city",
            "house_quartier",
            "house_reference",
            "payment_type",
            "amount",
            "currency",
            "payment_method",
            "orange_money_number",
            "orange_money_account_name",
            "external_transaction_reference",
            "proof_image",
            "proof_image_url",
            "status",
            "admin_comment",
            "verified_by",
            "verified_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "invoice_number",
            "payment_reference",
            "owner",
            "house",
            "payment_type",
            "amount",
            "currency",
            "payment_method",
            "orange_money_number",
            "orange_money_account_name",
            "status",
            "admin_comment",
            "verified_by",
            "verified_at",
            "created_at",
            "updated_at",
        ]

    def get_owner_name(self, obj):
        name = f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return name or obj.owner.username

    def get_owner_phone(self, obj):
        return getattr(getattr(obj.owner, "profile", None), "phone", "")

    def get_owner_email(self, obj):
        return obj.owner.email

    def get_house_reference(self, obj):
        return f"HOUSE-{obj.house_id}"

    def get_proof_image_url(self, obj):
        if not obj.proof_image:
            return ""
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(obj.proof_image.url)
        return obj.proof_image.url


class PublicationInvoiceProofSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicationPaymentInvoice
        fields = ["external_transaction_reference", "proof_image"]


class PublicationInvoiceReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[PublicationPaymentInvoice.Status.PAID, PublicationPaymentInvoice.Status.REJECTED])
    admin_comment = serializers.CharField(required=False, allow_blank=True)


class PublicationPaymentInvoiceSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    owner_phone = serializers.SerializerMethodField()
    owner_email = serializers.SerializerMethodField()
    house_title = serializers.CharField(source="house.title", read_only=True)
    house_city = serializers.CharField(source="house.city", read_only=True)
    house_quartier = serializers.CharField(source="house.quartier", read_only=True)
    house_reference = serializers.SerializerMethodField()
    proof_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PublicationPaymentInvoice
        fields = [
            "id",
            "invoice_number",
            "payment_reference",
            "owner",
            "owner_name",
            "owner_phone",
            "owner_email",
            "house",
            "house_title",
            "house_city",
            "house_quartier",
            "house_reference",
            "payment_type",
            "amount",
            "currency",
            "payment_method",
            "orange_money_number",
            "orange_money_account_name",
            "external_transaction_reference",
            "proof_image",
            "proof_image_url",
            "status",
            "admin_comment",
            "verified_by",
            "verified_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "invoice_number",
            "payment_reference",
            "owner",
            "house",
            "payment_type",
            "amount",
            "currency",
            "payment_method",
            "orange_money_number",
            "orange_money_account_name",
            "status",
            "admin_comment",
            "verified_by",
            "verified_at",
            "created_at",
            "updated_at",
        ]

    def get_owner_name(self, obj):
        name = f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return name or obj.owner.username

    def get_owner_phone(self, obj):
        return getattr(getattr(obj.owner, "profile", None), "phone", "")

    def get_owner_email(self, obj):
        return obj.owner.email

    def get_house_reference(self, obj):
        return f"HOUSE-{obj.house_id}"

    def get_proof_image_url(self, obj):
        if not obj.proof_image:
            return ""
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(obj.proof_image.url)
        return obj.proof_image.url


class PublicationInvoiceProofSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicationPaymentInvoice
        fields = ["external_transaction_reference", "proof_image"]


class PublicationInvoiceReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[PublicationPaymentInvoice.Status.PAID, PublicationPaymentInvoice.Status.REJECTED])
    admin_comment = serializers.CharField(required=False, allow_blank=True)


class ReviewSerializer(serializers.ModelSerializer):
    userName = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "house", "rating", "comment", "userName", "created_at"]
        read_only_fields = ["id", "userName", "created_at"]


class VisitRequestSerializer(serializers.ModelSerializer):
    houseTitle = serializers.CharField(source="house.title", read_only=True)
    clientName = serializers.CharField(source="client.username", read_only=True)
    clientFirstName = serializers.CharField(source="client.first_name", read_only=True)
    clientLastName = serializers.CharField(source="client.last_name", read_only=True)
    clientEmail = serializers.EmailField(source="client.email", read_only=True)
    clientPhone = serializers.SerializerMethodField()
    clientWhatsapp = serializers.SerializerMethodField()
    clientPhoto = serializers.SerializerMethodField()

    class Meta:
        model = VisitRequest
        fields = [
            "id", "house", "houseTitle", "client", "clientName", "clientFirstName", "clientLastName", "clientEmail", "clientPhone", "clientWhatsapp", "clientPhoto", "requested_date", "status", "deposit_status", "deposit_amount", "created_at",
        ]
        read_only_fields = ["id", "client", "clientName", "status", "deposit_status", "deposit_amount", "created_at"]

    def get_clientPhone(self, obj):
        return getattr(getattr(obj.client, "profile", None), "phone", "")

    def get_clientWhatsapp(self, obj):
        phone = self.get_clientPhone(obj)
        return "".join(c for c in phone if c.isdigit())

    def get_clientPhoto(self, obj):
        profile = getattr(obj.client, "profile", None)
        if profile and getattr(profile, "photo", None):
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(profile.photo.url)
            return profile.photo.url
        return getattr(profile, "photo_url", "") if profile else ""


class ReservationSerializer(serializers.ModelSerializer):
    houseTitle = serializers.CharField(source="house.title", read_only=True)
    clientName = serializers.CharField(source="client.username", read_only=True)
    clientFirstName = serializers.CharField(source="client.first_name", read_only=True)
    clientLastName = serializers.CharField(source="client.last_name", read_only=True)
    clientEmail = serializers.EmailField(source="client.email", read_only=True)
    clientPhone = serializers.SerializerMethodField()
    clientWhatsapp = serializers.SerializerMethodField()
    clientPhoto = serializers.SerializerMethodField()
    houseImage = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            "id", "house", "houseTitle", "houseImage", "client", "clientName", "clientFirstName", "clientLastName", "clientEmail", "clientPhone", "clientWhatsapp", "clientPhoto", "start_date", "end_date", "total_price", "commission", "status", "created_at",
        ]
        read_only_fields = ["id", "client", "clientName", "total_price", "commission", "status", "created_at"]

    def get_clientPhone(self, obj):
        return getattr(getattr(obj.client, "profile", None), "phone", "")

    def get_clientWhatsapp(self, obj):
        phone = self.get_clientPhone(obj)
        return "".join(c for c in phone if c.isdigit())

    def get_clientPhoto(self, obj):
        profile = getattr(obj.client, "profile", None)
        if profile and getattr(profile, "photo", None):
            request = self.context.get("request")
            if request is not None:
                return request.build_absolute_uri(profile.photo.url)
            return profile.photo.url
        return getattr(profile, "photo_url", "") if profile else ""

    def get_houseImage(self, obj):
        image = ""
        if obj.house and obj.house.image_urls:
            image = obj.house.image_urls[0]
        elif obj.house and obj.house.image_keys:
            image = obj.house.image_keys[0]

        request = self.context.get("request")
        if request is not None and image.startswith("/"):
            return request.build_absolute_uri(image)
        return image


class FavoriteSerializer(serializers.ModelSerializer):
    house = HouseSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "house", "created_at"]


class PlatformSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSetting
        fields = ["publication_fee", "reservation_commission_percent", "visit_deposit", "featured_fee", "support_fee"]
