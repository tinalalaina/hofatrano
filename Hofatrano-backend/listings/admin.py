from django.contrib import admin

from .models import Favorite, House, PlatformSetting, PublicationPaymentInvoice, Reservation, Review, UserProfile, VisitRequest

admin.site.register(UserProfile)
admin.site.register(House)
admin.site.register(PublicationPaymentInvoice)
admin.site.register(Favorite)
admin.site.register(Review)
admin.site.register(VisitRequest)
admin.site.register(Reservation)
admin.site.register(PlatformSetting)
