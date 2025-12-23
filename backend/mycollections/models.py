from django.db import models
from django.conf import settings

class Collection(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='collection_images/', blank=True, null=True)
    qr_code = models.ImageField(upload_to='collection_qrcodes/', blank=True, null=True)
    is_shared = models.BooleanField(default=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_approved = models.BooleanField(default=False)

    # เพิ่มสำหรับตรวจสอบ/โอนกรรมสิทธิ์
    arttoy_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    current_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="owned_items"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class VerificationRequest(models.Model):
    PENDING, APPROVED, REJECTED = "PENDING", "APPROVED", "REJECTED"
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="verify_requests")
    challenge_id = models.CharField(max_length=64)
    phrase = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    file = models.FileField(upload_to='verify_proofs/', null=True, blank=True)
    decoded_qr = models.TextField(blank=True)
    phash = models.CharField(max_length=32, blank=True)
    score = models.IntegerField(default=0)
    verdict = models.CharField(max_length=32, default="unknown")
    status = models.CharField(max_length=10, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

class OwnershipHistory(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="ownership_history")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    from_at = models.DateTimeField()
    to_at = models.DateTimeField(null=True, blank=True)

class OwnershipTransfer(models.Model):
    INIT, USED, CANCELLED = "INIT", "USED", "CANCELLED"
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transfers_out")
    transfer_code = models.CharField(max_length=32, unique=True)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=10, default=INIT)
    created_at = models.DateTimeField(auto_now_add=True)
