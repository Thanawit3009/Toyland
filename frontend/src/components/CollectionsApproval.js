import React, { useState, useEffect, useCallback } from "react";
import { refreshAccessToken, isAdmin } from "../utils/auth";
import "./CollectionsApproval.css";
import jsQR from "jsqr";


const CollectionsApproval = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState("");

  const fetchPendingCollections = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        "http://localhost:8000/api/mycollections/admin/collections/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(
          "http://localhost:8000/api/mycollections/admin/collections/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
      }

      if (!res.ok) throw new Error(`Failed to fetch. ${res.status}`);
      const data = await res.json();
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลคอลเล็กชัน");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin()) {
      setError("คุณไม่ได้รับอนุญาตให้ดูข้อมูลนี้");
      return;
    }
    fetchPendingCollections();
  }, [fetchPendingCollections]);

  const handleApprove = async (id) => {
    if (!window.confirm("ยืนยันอนุมัติคอลเล็กชันนี้?")) return;
    setSubmittingId(id);
    try {
      let token = localStorage.getItem("token");
      let res = await fetch(
        `http://localhost:8000/api/mycollections/admin/collections/${id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(
          `http://localhost:8000/api/mycollections/admin/collections/${id}/`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
      }

      if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
      alert("อนุมัติคอลเล็กชันสำเร็จ");
      fetchPendingCollections();
    } catch (err) {
      console.error("Error approving collection:", err);
      setError("เกิดข้อผิดพลาดในการอนุมัติคอลเล็กชัน");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("ยืนยันปฏิเสธและลบคำขอนี้?")) return;
    setSubmittingId(id);
    try {
      let token = localStorage.getItem("token");
      let res = await fetch(
        `http://localhost:8000/api/mycollections/admin/collections/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(
          `http://localhost:8000/api/mycollections/admin/collections/${id}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
      }

      if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
      alert("ปฏิเสธคอลเล็กชันสำเร็จ");
      fetchPendingCollections();
    } catch (err) {
      console.error("Error rejecting collection:", err);
      setError("เกิดข้อผิดพลาดในการปฏิเสธคอลเล็กชัน");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleScanQr = async (qrPath) => {
    if (!qrPath) {
      alert("ไม่มีไฟล์ QR ให้สแกน");
      return;
    }

    const imageUrl = `http://localhost:8000${qrPath}`;

    try {
      // โหลดรูป
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // วาดลง canvas ชั่วคราว
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // ใช้ jsQR อ่าน
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (!code) {
        alert("ไม่สามารถอ่าน QR จากรูปนี้ได้");
        return;
      }

      const text = code.data?.trim() || "";

      if (!text) {
        alert("สแกนได้แล้ว แต่ไม่มีข้อมูลใน QR");
        return;
      }

      // ถ้าเป็นลิงก์ให้ถามว่าจะเปิดเลยไหม
      if (/^https?:\/\//i.test(text)) {
        const ok = window.confirm(
          `พบลิงก์จาก QR:\n\n${text}\n\nต้องการเปิดในแท็บใหม่หรือไม่?`
        );
        if (ok) {
          window.open(text, "_blank", "noopener,noreferrer");
        }
      } else {
        // ไม่ใช่ลิงก์ เป็นข้อความธรรมดา
        alert(`ผลจากการสแกน QR:\n\n${text}`);
      }
    } catch (err) {
      console.error("Error scanning QR:", err);
      alert("เกิดข้อผิดพลาดในการสแกน QR");
    }
  };



  return (
    <div className="collections-approval">
      <h1>คอลเล็กชันที่รอการอนุมัติ</h1>
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ชื่อคอลเล็กชัน</th>
              <th>ภาพ</th>
              <th>QR ที่อัปโหลด</th>
              <th>ผู้ส่งคำขอ</th>
              <th>ArtToy ID</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {collections.length > 0 ? (
              collections.map((c) => (
                <tr key={c.id}>
                  {/* ชื่อคอลเล็กชัน */}
                  <td>{c.name || "—"}</td>

                  {/* ภาพคอลเล็กชัน */}
                  <td>
                    {c.image ? (
                      <img
                        src={`http://localhost:8000${c.image}`}
                        alt={c.name}
                        className="collection-image"
                        onError={(e) =>
                          (e.target.src = "default-collection.jpg")
                        }
                      />
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* QR ที่อัปโหลด */}
                  <td>
                    {c.qr_code ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <img
                          src={`http://localhost:8000${c.qr_code}`}
                          alt="QR"
                          className="qr-code-image"
                          onError={(e) => (e.target.src = "default-qr-code.jpg")}
                        />
                        <button
                          type="button"
                          onClick={() => handleScanQr(c.qr_code)}
                          className="scan-qr-button"
                        >
                          สแกน QR
                        </button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* ผู้ส่งคำขอ (ตอนนี้ serializer คืน user เป็น id) */}
                  <td>{c.user || "—"}</td>

                  {/* ArtToy ID เดียว */}
                  <td>{c.arttoy_id || "—"}</td>

                  {/* ปุ่มจัดการ */}
                  <td>
                    <button
                      className="approve-button"
                      onClick={() => handleApprove(c.id)}
                      disabled={submittingId === c.id}
                    >
                      อนุมัติ
                    </button>
                    <button
                      className="reject-button"
                      onClick={() => handleReject(c.id)}
                      disabled={submittingId === c.id}
                    >
                      ปฏิเสธ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  ไม่มีคอลเล็กชันที่ต้องตรวจสอบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 16 }}>
        <p>
          ⚠️ หน้านี้ใช้สำหรับ <b>อนุมัติคำขอเพิ่มคอลเล็กชัน</b> เท่านั้น
        </p>
      </div>
    </div>
  );
};

export default CollectionsApproval;
