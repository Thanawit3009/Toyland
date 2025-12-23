from rest_framework import serializers
from .models import Collection, VerificationRequest, OwnershipTransfer


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = [
            "id",
            "name",
            "description",
            "image",
            "qr_code",
            "is_shared",
            "user",
            "is_approved",
            "arttoy_id",
            "is_verified",
            "current_owner",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "is_shared",
            "is_approved",
            "is_verified",
            "current_owner",
            "user",
            "created_at",
            "updated_at",
        ]


# ---------- Verify ----------
class VerifyStartSerializer(serializers.Serializer):
    collection_id = serializers.IntegerField()

class VerifyProofSerializer(serializers.Serializer):
    challenge_id = serializers.CharField()
    file = serializers.FileField()

class AdminVerifyDecisionSerializer(serializers.Serializer):
    request_id = serializers.IntegerField()
    decision = serializers.ChoiceField(choices=['APPROVE', 'REJECT'])

# ---------- Transfer ----------
class TransferInitSerializer(serializers.Serializer):
    collection_id = serializers.IntegerField()

class TransferAcceptSerializer(serializers.Serializer):
    transfer_code = serializers.CharField()
