from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework import status

from django.utils import timezone
from datetime import timedelta
import secrets

from .models import (
    Collection,
    VerificationRequest,
    OwnershipHistory,
    OwnershipTransfer,
)
from .serializers import (
    CollectionSerializer,
    VerifyStartSerializer,
    VerifyProofSerializer,
    AdminVerifyDecisionSerializer,
    TransferInitSerializer,
    TransferAcceptSerializer,
)

# -------- ผู้ใช้ส่งคำขอเพิ่มคอลเล็กชัน --------
# View สำหรับผู้ใช้ส่งคำขอเพิ่มคอลเล็กชั่น
class CreateCollectionRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        arttoy_id = request.data.get("arttoy_id")

        # กันเคส arttoy_id ซ้ำในระบบ
        if arttoy_id:
            if Collection.objects.filter(arttoy_id=arttoy_id, is_approved=True).exists():
                return Response(
                    {"detail": "มี ArtToy ที่ใช้ ArtToy ID นี้อยู่ในระบบแล้ว ห้ามใช้ซ้ำ"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if Collection.objects.filter(
                arttoy_id=arttoy_id,
                is_approved=False,
                user=request.user
            ).exists():
                return Response(
                    {"detail": "คุณได้ส่งคำขอด้วย ArtToy ID นี้แล้ว กรุณารอการอนุมัติ"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = CollectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                user=request.user,
                current_owner=request.user,  # ใช้เป็นเจ้าของปัจจุบันตั้งแต่สร้าง
            )
            return Response(
                {"message": "สร้างคำขอคอลเล็กชันสำเร็จ กำลังรอแอดมินอนุมัติ"},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------- แอดมินจัดการคำขอคอลเล็กชัน (อนุมัติ/ลบ) --------
class AdminCollectionApprovalView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # ดึงเฉพาะที่ยังไม่อนุมัติ ให้แอดมินตรวจ
        collections = Collection.objects.filter(is_approved=False).order_by("-created_at")
        serializer = CollectionSerializer(collections, many=True)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            collection = Collection.objects.get(pk=pk)
            collection.is_approved = True
            collection.save()
            return Response({"message": "Collection approved successfully."})
        except Collection.DoesNotExist:
            return Response({"error": "Collection not found."}, status=404)

    def delete(self, request, pk):
        try:
            collection = Collection.objects.get(pk=pk)
            collection.delete()
            return Response({"message": "Collection deleted successfully."})
        except Collection.DoesNotExist:
            return Response({"error": "Collection not found."}, status=404)

# -------- ดูคอลเล็กชันที่อนุมัติแล้วของผู้ใช้คนปัจจุบัน --------
class ApprovedCollectionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        collections = Collection.objects.filter(
            is_approved=True,
            current_owner=request.user,  # ดูจากเจ้าของปัจจุบัน
        )
        serializer = CollectionSerializer(collections, many=True)
        return Response(serializer.data)


class PendingCollectionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ดึงเฉพาะคอลเล็กชันที่ยังไม่อนุมัติของผู้ใช้คนนี้
        collections = Collection.objects.filter(is_approved=False, user=request.user).order_by("-created_at")
        serializer = CollectionSerializer(collections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# -------- แก้ชื่อคอลเล็กชัน --------
class EditCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            collection = Collection.objects.get(
                pk=pk,
                current_owner=request.user
            )

            new_desc = request.data.get("description")
            if not new_desc:
                return Response(
                    {"error": "Description is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            collection.description = new_desc
            collection.save()

            return Response(
                {"message": "Description updated successfully."},
                status=status.HTTP_200_OK
            )

        except Collection.DoesNotExist:
            return Response(
                {"error": "Collection not found or not authorized."},
                status=status.HTTP_404_NOT_FOUND
            )


# -------- แชร์/ยกเลิกแชร์ --------
class ShareCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            collection = Collection.objects.get(
                pk=pk,
                current_owner=request.user,   # ✅ ให้เจ้าของปัจจุบันเท่านั้นที่แชร์ได้
                is_approved=True,             # (แนะนำ) ต้องเป็นของที่อนุมัติแล้วเท่านั้น
            )
            collection.is_shared = True
            collection.save()
            return Response(
                {"message": "Collection shared successfully."},
                status=status.HTTP_200_OK
            )
        except Collection.DoesNotExist:
            return Response(
                {"error": "Collection not found or not authorized."},
                status=status.HTTP_404_NOT_FOUND,
            )


class UnshareCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            collection = Collection.objects.get(
                pk=pk,
                current_owner=request.user,    # ✅ เจ้าของปัจจุบันเท่านั้นที่ยกเลิกแชร์ได้
                is_approved=True,
            )
            collection.is_shared = False
            collection.save()
            return Response(
                {"message": "Collection unshared successfully."},
                status=status.HTTP_200_OK
            )
        except Collection.DoesNotExist:
            return Response(
                {"error": "Collection not found or not authorized."},
                status=status.HTTP_404_NOT_FOUND,
            )

# -------- หน้า public (เฉพาะที่ shared + approved) --------
class PublicCollectionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        collections = (
            Collection.objects
            .filter(is_shared=True, is_approved=True)
            .select_related('current_owner', 'user')  # ดึงทั้งสองไว้เผื่อ fallback
            .order_by('-created_at')
        )

        data = []
        for collection in collections:
            # ใช้เจ้าของปัจจุบันเป็นหลัก ถ้าไม่มีค่อย fallback ไปที่ user เดิม
            owner = collection.current_owner or collection.user

            data.append({
                "id": collection.id,
                "name": collection.name,
                "description": collection.description,
                "image": request.build_absolute_uri(collection.image.url) if collection.image else None,
                "created_at": collection.created_at,
                "user": {
                    "id": owner.id if owner else None,
                    "first_name": owner.first_name if owner else "",
                    "last_name": owner.last_name if owner else "",
                    "profile_picture": (
                        request.build_absolute_uri(owner.profile_picture.url)
                        if owner and owner.profile_picture
                        else None
                    ),
                }
            })

        return Response(data, status=status.HTTP_200_OK)


# -------- Approved collections ของสมาชิกคนหนึ่ง (public/member) --------
class MemberApprovedCollectionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, member_id):
        try:
            collections = Collection.objects.filter(current_owner_id=member_id, is_approved=True)
            if not collections.exists():
                return Response({"message": "คนนี้ยังไม่มีคอลเล็กชั่น"}, status=status.HTTP_200_OK)
            serializer = CollectionSerializer(collections, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# -------- ลบคอลเล็กชัน (เฉพาะเจ้าของ) --------
class DeleteCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, *args, **kwargs):
        try:
            # ต้องเป็นของ user คนนี้ และยังไม่อนุมัติเท่านั้น
            collection = Collection.objects.get(pk=pk, user=request.user)

            if collection.is_approved:
                return Response(
                    {"error": "ไม่สามารถลบคอลเล็กชันที่อนุมัติแล้วได้ (ใช้ยกเลิกแชร์หรือโอนกรรมสิทธิ์แทน)"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            collection.delete()
            return Response(
                {"message": "ลบคำขอเพิ่มคอลเล็กชันสำเร็จ"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except Collection.DoesNotExist:
            return Response(
                {"error": "ไม่พบคอลเล็กชันหรือคุณไม่มีสิทธิ์ลบ"},
                status=status.HTTP_404_NOT_FOUND,
            )


# ===================== VERIFY (ตรวจของแท้+เจ้าของ) =====================

class VerifyStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = VerifyStartSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        col = Collection.objects.filter(
            id=ser.validated_data['collection_id'],
            current_owner=request.user
        ).first()
        if not col:
            return Response({"error": "Not owner or collection not found"}, status=403)

        challenge_id = secrets.token_hex(16)
        phrase = f"TOY-{secrets.randbelow(9000)+1000}-{secrets.choice(['SUN','MOON','STAR','RAIN'])}"
        expires_at = timezone.now() + timedelta(minutes=10)

        VerificationRequest.objects.create(
            user=request.user,
            collection=col,
            challenge_id=challenge_id,
            phrase=phrase,
            expires_at=expires_at,
            status=VerificationRequest.PENDING
        )
        return Response({"challenge_id": challenge_id, "phrase": phrase, "expires_at": expires_at.isoformat()})

class VerifyProofView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = VerifyProofSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        req = VerificationRequest.objects.filter(
            challenge_id=ser.validated_data['challenge_id'],
            user=request.user
        ).first()
        if not req:
            return Response({"error": "Challenge not found"}, status=404)
        if req.expires_at < timezone.now():
            return Response({"error": "Challenge expired"}, status=400)

        file = request.FILES.get('file')
        if not file:
            return Response({"error": "file is required"}, status=400)

        req.file = file
        req.decoded_qr = ""   # (ต่อยอดภายหลัง: ถอด QR ที่ฝั่งเซิร์ฟเวอร์)
        req.phash = ""        # (ต่อยอดภายหลัง: คำนวณ pHash)
        req.score = 60        # ค่าเบื้องต้น รอแอดมินตรวจ
        req.verdict = "pending_admin"
        req.save()

        return Response({"request_id": req.id, "score": req.score, "verdict": req.verdict}, status=201)

class AdminVerifyRequestsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        items = VerificationRequest.objects.filter(status=VerificationRequest.PENDING).select_related('user', 'collection')
        data = [{
            "id": r.id,
            "user_username": r.user.email,
            "arttoy_id": r.collection.arttoy_id,
            "score": r.score,
            "verdict": r.verdict,
            "file_url": r.file.url if r.file else None,
            "decoded_qr": r.decoded_qr,
            "owner_now": r.collection.current_owner.email if r.collection.current_owner else None,
            "phrase": r.phrase,
            "expires_at": r.expires_at,
        } for r in items]
        return Response(data)

class AdminVerifyApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ser = AdminVerifyDecisionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        rid = ser.validated_data['request_id']
        decision = ser.validated_data['decision']

        try:
            r = VerificationRequest.objects.select_related('collection', 'user').get(id=rid)
        except VerificationRequest.DoesNotExist:
            return Response({"error": "request not found"}, status=404)

        if decision == "APPROVE":
            r.status = VerificationRequest.APPROVED
            r.collection.is_verified = True
            r.collection.current_owner = r.user
            r.collection.save()
            r.save()
            # เปิดช่วงประวัติเจ้าของ (ถ้ายังไม่มีช่วงล่าสุด)
            OwnershipHistory.objects.get_or_create(
                collection=r.collection,
                owner=r.user,
                from_at=timezone.now()
            )
        else:
            r.status = VerificationRequest.REJECTED
            r.save()

        return Response({"ok": True})

# ===================== TRANSFER (โอนกรรมสิทธิ์) =====================

class TransferInitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = TransferInitSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        col = Collection.objects.filter(
            id=ser.validated_data['collection_id'],
            current_owner=request.user,
            is_approved=True,           # 👈 เพิ่มบรรทัดนี้
        ).first()
        if not col:
            return Response(
                {"error": "ต้องเป็นเจ้าของและคอลเล็กชันต้องได้รับการอนุมัติแล้วเท่านั้นถึงจะโอนได้"},
                status=403
            )

        code = secrets.token_urlsafe(16)[:22]
        expires_at = timezone.now() + timedelta(minutes=10)
        OwnershipTransfer.objects.create(
            collection=col,
            from_user=request.user,
            transfer_code=code,
            expires_at=expires_at
        )
        return Response({"transfer_code": code, "expires_at": expires_at.isoformat()})

class TransferAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = TransferAcceptSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        code = ser.validated_data['transfer_code']

        ot = OwnershipTransfer.objects.filter(transfer_code=code).first()
        if not ot:
            return Response({"error": "invalid code"}, status=404)
        if ot.status != OwnershipTransfer.INIT or ot.expires_at < timezone.now():
            return Response({"error": "code expired/used"}, status=400)

        col = ot.collection
        # เปลี่ยนเจ้าของ
        col.current_owner = request.user
        col.is_verified = True     # ถือว่ายังเป็นของแท้ต่อเนื่องหลังโอน
        col.save()

        ot.status = OwnershipTransfer.USED
        ot.save()

        # ปิดช่วงเดิม และเปิดช่วงใหม่
        OwnershipHistory.objects.filter(collection=col, to_at__isnull=True).update(to_at=timezone.now())
        OwnershipHistory.objects.create(collection=col, owner=request.user, from_at=timezone.now())

        return Response({"ok": True})
