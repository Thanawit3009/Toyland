from django.contrib import admin
from .models import Collection, VerificationRequest, OwnershipHistory, OwnershipTransfer

@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user", "is_approved", "is_verified", "current_owner", "arttoy_id", "created_at")
    search_fields = ("name", "arttoy_id", "user__email")

@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "collection", "user", "status", "score", "verdict", "created_at")
    list_filter = ("status",)

@admin.register(OwnershipHistory)
class OwnershipHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "collection", "owner", "from_at", "to_at")

@admin.register(OwnershipTransfer)
class OwnershipTransferAdmin(admin.ModelAdmin):
    list_display = ("id", "collection", "from_user", "transfer_code", "status", "expires_at", "created_at")
    list_filter = ("status",)
