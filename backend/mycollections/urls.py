from django.urls import path
from .views import (
    CreateCollectionRequestView,
    AdminCollectionApprovalView,
    ApprovedCollectionsView,
    PendingCollectionsView, 
    EditCollectionView,
    ShareCollectionView,
    UnshareCollectionView,
    PublicCollectionsView,
    MemberApprovedCollectionsAPIView,
    DeleteCollectionView,

    # ใหม่
    VerifyStartView, VerifyProofView,
    AdminVerifyRequestsView, AdminVerifyApproveView,
    TransferInitView, TransferAcceptView,
)

urlpatterns = [
    path("collections/request/", CreateCollectionRequestView.as_view(), name="create-collection-request"),

    path("admin/collections/", AdminCollectionApprovalView.as_view(), name="admin-collection-list"),
    path("admin/collections/<int:pk>/", AdminCollectionApprovalView.as_view(), name="admin-collection-detail"),

    path("collections/approved/", ApprovedCollectionsView.as_view(), name="approved-collections"),
    path("collections/<int:pk>/edit/", EditCollectionView.as_view(), name="edit-collection"),

    path("collections/pending/", PendingCollectionsView.as_view(),name="pending-collections",),

    path("collections/<int:pk>/share/",  ShareCollectionView.as_view(),  name="share-collection"),
    path("collections/<int:pk>/unshare/", UnshareCollectionView.as_view(), name="unshare-collection"),

    path("collections/shared/", PublicCollectionsView.as_view(), name="shared-collections"),
    path("collections/<int:pk>/delete/", DeleteCollectionView.as_view(), name="delete-collection"),

    path("members/<int:member_id>/collections/approved/", MemberApprovedCollectionsAPIView.as_view(),
         name="member-approved-collections"),

    # ---------- Verify ----------
    path("verify/start/",   VerifyStartView.as_view(),        name="verify-start"),
    path("verify/proof/",   VerifyProofView.as_view(),        name="verify-proof"),
    path("verify/admin/requests/", AdminVerifyRequestsView.as_view(), name="verify-requests"),
    path("verify/admin/approve/",  AdminVerifyApproveView.as_view(),  name="verify-approve"),

    # ---------- Transfer ----------
    path("ownership/transfer/init/",   TransferInitView.as_view(),   name="transfer-init"),
    path("ownership/transfer/accept/", TransferAcceptView.as_view(), name="transfer-accept"),
]
