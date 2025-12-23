import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { refreshAccessToken } from "../utils/auth";
import Navbar from "./Navbar";
import "./MyCollectionPage.css";

const MyCollectionPage = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    qr_code: null,
    arttoy_id: "",
  });

  const [approvedCollections, setApprovedCollections] = useState([]);
  const [pendingCollections, setPendingCollections] = useState([]);

  const [loadingApproved, setLoadingApproved] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ===== ฟังก์ชันดึงคอลเล็กชันที่อนุมัติแล้ว =====
  const fetchApproved = useCallback(async () => {
    setLoadingApproved(true);
    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        "http://localhost:8000/api/mycollections/collections/approved/",
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
          "http://localhost:8000/api/mycollections/collections/approved/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
      }

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setApprovedCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching approved collections:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลคอลเล็กชันที่อนุมัติแล้ว");
    } finally {
      setLoadingApproved(false);
    }
  }, []);

  // ===== ฟังก์ชันดึงคำขอที่ยังไม่อนุมัติ =====
  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        "http://localhost:8000/api/mycollections/collections/pending/",
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
          "http://localhost:8000/api/mycollections/collections/pending/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
      }

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setPendingCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching pending collections:", err);
      setError("เกิดข้อผิดพลาดในการดึงคำขอคอลเล็กชัน");
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // ===== ดึงข้อมูลตอนโหลดหน้า =====
  useEffect(() => {
    fetchApproved();
    fetchPending();
  }, [fetchApproved, fetchPending]);

  // ===== ลบคำขอ (เฉพาะที่ยังไม่อนุมัติ) =====
  const handleDeletePending = async (id) => {
    if (!window.confirm("ยืนยันลบคำขอคอลเล็กชันนี้?")) return;

    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        `http://localhost:8000/api/mycollections/collections/${id}/delete/`,
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
          `http://localhost:8000/api/mycollections/collections/${id}/delete/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
      }

      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData.error ||
          errData.detail ||
          `ลบคำขอไม่สำเร็จ (status: ${res.status})`;
        alert(msg);
        return;
      }

      alert("ลบคำขอคอลเล็กชันสำเร็จ");
      setPendingCollections((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error("Error deleting pending collection:", err);
      alert("เกิดข้อผิดพลาดในการลบคำขอคอลเล็กชัน");
    }
  };

  // ===== share / unshare / edit ของคอลเล็กชันที่อนุมัติแล้ว =====
  const handleShare = async (id) => {
    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        `http://localhost:8000/api/mycollections/collections/${id}/share/`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(
          `http://localhost:8000/api/mycollections/collections/${id}/share/`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (!res.ok) throw new Error(`Failed to share collection. ${res.status}`);
      alert("แชร์คอลเล็กชันสำเร็จ");
      fetchApproved();
    } catch (err) {
      console.error("Error sharing collection:", err);
      alert("เกิดข้อผิดพลาดในการแชร์คอลเล็กชัน");
    }
  };

  const handleUnshare = async (id) => {
    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        `http://localhost:8000/api/mycollections/collections/${id}/unshare/`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(
          `http://localhost:8000/api/mycollections/collections/${id}/unshare/`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (!res.ok)
        throw new Error(`Failed to unshare collection. ${res.status}`);
      alert("ยกเลิกแชร์คอลเล็กชันสำเร็จ");
      fetchApproved();
    } catch (err) {
      console.error("Error unsharing collection:", err);
      alert("เกิดข้อผิดพลาดในการยกเลิกแชร์คอลเล็กชัน");
    }
  };

  const handleEdit = async (id, newDescription) => {
    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        `http://localhost:8000/api/mycollections/collections/${id}/edit/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description: newDescription }),
        }
      );

      if (!res.ok)
        throw new Error(`Failed to edit collection. Status: ${res.status}`);

      alert("แก้ไขคำอธิบายสำเร็จ");
      fetchApproved();
    } catch (err) {
      console.error("Error editing collection:", err);
      alert("เกิดข้อผิดพลาดในการแก้ไขคำอธิบาย");
    }
  };


  // ===== form เพิ่มคำขอ =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===== สร้างโค้ดโอนกรรมสิทธิ์ =====
  const handleInitTransfer = async (collectionId) => {
    if (!window.confirm("ต้องการสร้างโค้ดสำหรับโอนกรรมสิทธิ์ ArtToy นี้ใช่ไหม?")) return;

    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        "http://localhost:8000/api/mycollections/ownership/transfer/init/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ collection_id: collectionId }),
        }
      );

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(
          "http://localhost:8000/api/mycollections/ownership/transfer/init/",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ collection_id: collectionId }),
          }
        );
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData.error ||
          errData.detail ||
          `สร้างโค้ดโอนไม่สำเร็จ (status: ${res.status})`;
        alert(msg);
        return;
      }

      const data = await res.json();
      const code = data.transfer_code;

      // 🔹 พยายามคัดลอกโค้ดให้โดยอัตโนมัติ
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(code);
          alert(
            `โค้ดสำหรับโอนกรรมสิทธิ์ถูกคัดลอกให้แล้ว:\n\n${code}\n\nนำไปวางส่งให้เพื่อนทางแชทได้เลย (โค้ดมีอายุ 10 นาที)`
          );
          return;
        } catch (e) {
          console.error("ไม่สามารถคัดลอกอัตโนมัติได้:", e);
        }
      }

      // 🔹 fallback ถ้าใช้ clipboard API ไม่ได้ ให้ใช้ prompt ที่คัดลอกเองได้
      window.prompt(
        "โค้ดสำหรับโอนกรรมสิทธิ์ (กด Ctrl+C เพื่อคัดลอก แล้วกด Enter):",
        code
      );
    } catch (err) {
      console.error("Error init transfer:", err);
      alert("เกิดข้อผิดพลาดในการสร้างโค้ดโอนกรรมสิทธิ์");
    }
  };


  // ===== รับโอนกรรมสิทธิ์ด้วยโค้ด =====
  const handleAcceptTransfer = async () => {
    const code = prompt("กรุณากรอกโค้ดโอนกรรมสิทธิ์ที่คุณได้รับ:");
    if (!code) return;

    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        "http://localhost:8000/api/mycollections/ownership/transfer/accept/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transfer_code: code }),
        }
      );

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(
          "http://localhost:8000/api/mycollections/ownership/transfer/accept/",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ transfer_code: code }),
          }
        );
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData.error ||
          errData.detail ||
          `รับโอนไม่สำเร็จ (status: ${res.status})`;
        alert(msg);
        return;
      }

      alert("รับโอนกรรมสิทธิ์สำเร็จแล้ว!");
      // รีโหลดคอลเล็กชันที่เราถือครองตอนนี้
      fetchApproved();
    } catch (err) {
      console.error("Error accept transfer:", err);
      alert("เกิดข้อผิดพลาดในการรับโอนกรรมสิทธิ์");
    }
  };



  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [name]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("image", formData.image);
    formDataToSend.append("qr_code", formData.qr_code);
    formDataToSend.append("arttoy_id", formData.arttoy_id);

    try {
      let token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found. Please log in again.");

      let res = await fetch(
        "http://localhost:8000/api/mycollections/collections/request/",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataToSend,
        }
      );

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(
          "http://localhost:8000/api/mycollections/collections/request/",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formDataToSend,
          }
        );
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData.detail ||
          errData.message ||
          "ส่งคำขอเพิ่มคอลเล็กชันไม่สำเร็จ";
        alert(msg);
        return;
      }

      alert("คำขอของคุณถูกส่งไปยังแอดมินแล้ว");
      setFormVisible(false);
      setFormData({
        name: "",
        description: "",
        image: null,
        qr_code: null,
        topMessage: "",
        bottomMessage: "",
      });

      fetchPending(); // รีเฟรชรายการคำขอ
      navigate("/my-collections");
    } catch (err) {
      console.error("Error submitting collection request:", err);
      alert("เกิดข้อผิดพลาดในการส่งคำขอ");
    }
  };

  return (
    <div className="my-collection-page">
      <Navbar />
      <h1>My Collection</h1>

      {error && <p className="error">{error}</p>}

      <div className="buttons">
        <button onClick={() => setFormVisible(true)}>เพิ่มคอลเล็กชัน</button>

        {/* ปุ่มรับโอนด้วยโค้ด */}
        <button onClick={handleAcceptTransfer} style={{ marginLeft: "10px" }}>
          รับโอนด้วยโค้ด
        </button>
      </div>

      {formVisible ? (
        <form className="collection-form" onSubmit={handleSubmit}>
          <div>
            <label>ชื่อคอลเล็กชัน</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>คำอธิบาย</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label>เพิ่มรูปคอลเล็กชัน</label>
            <input type="file" name="image" onChange={handleFileChange} required />
          </div>
          <div>
            <label>เพิ่ม QR Code</label>
            <input type="file" name="qr_code" onChange={handleFileChange} required />
          </div>
          <div>
            <label>ArtToy ID</label>
            <input
              type="text"
              name="arttoy_id"
              value={formData.arttoy_id}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit">ยืนยัน</button>
          <button type="button" onClick={() => setFormVisible(false)}>
            ยกเลิก
          </button>
        </form>
      ) : (
        <div>
          {/* ----- กล่องคำขอรออนุมัติ ----- */}
          <h2 style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
            คำขอเพิ่มคอลเล็กชันที่รอการอนุมัติ
          </h2>
          {loadingPending ? (
            <p style={{ textAlign: "center", color: "#fff" }}>กำลังโหลดคำขอ...</p>
          ) : pendingCollections.length > 0 ? (
            <div className="collections-list">
              {pendingCollections.map((c) => (
                <div key={c.id} className="collection-card">
                  <img
                    src={
                      c.image
                        ? `http://localhost:8000${c.image}`
                        : "default-collection.jpg"
                    }
                    alt={c.name}
                    onError={(e) => (e.target.src = "default-collection.jpg")}
                  />
                  <h2>{c.name}</h2>
                  <p>{c.description}</p>
                  <p style={{ fontSize: 13, color: "#f97316" }}>
                    สถานะ: รอแอดมินอนุมัติ
                  </p>
                  <button
                    className="delete-button"
                    onClick={() => handleDeletePending(c.id)}
                  >
                    ลบคำขอ
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#fff" }}>
              ยังไม่มีคำขอที่รออนุมัติ
            </p>
          )}

          {/* ----- กล่องคอลเล็กชันที่อนุมัติแล้ว ----- */}
          <h2 style={{ color: "#fff", textAlign: "center", marginTop: 30 }}>
            คอลเล็กชันที่อนุมัติแล้ว
          </h2>
          {loadingApproved ? (
            <p style={{ textAlign: "center", color: "#fff" }}>
              กำลังโหลดคอลเล็กชัน...
            </p>
          ) : approvedCollections.length > 0 ? (
            <div className="collections-list">
              {approvedCollections.map((collection) => (
                <div key={collection.id} className="collection-card">
                  <img
                    src={
                      collection.image
                        ? `http://localhost:8000${collection.image}`
                        : "default-collection.jpg"
                    }
                    alt={collection.name}
                    onError={(e) => (e.target.src = "default-collection.jpg")}
                  />
                  <h2>{collection.name}</h2>
                  <p>{collection.description}</p>

                  <div className="card-actions">
                    <button
                      className="share-button"
                      onClick={() => handleShare(collection.id)}
                    >
                      แชร์
                    </button>
                    <button
                      className="unshare-button"
                      onClick={() => handleUnshare(collection.id)}
                    >
                      ยกเลิกแชร์
                    </button>
                    <button
                      className="edit-button"
                      onClick={() => {
                        const newDesc = prompt(
                          "กรุณาใส่คำอธิบายใหม่ของคอลเล็กชัน:",
                          collection.description || ""
                        );
                        if (newDesc === null) return; // กดยกเลิก
                        if (!newDesc.trim()) {
                          alert("คำอธิบายห้ามว่าง");
                          return;
                        }

                        handleEdit(collection.id, newDesc);
                      }}
                    >
                      แก้ไขคำอธิบาย
                    </button>

                    {/* 👇 ปุ่มใหม่ โอนกรรมสิทธิ์ */}
                    <button
                      className="transfer-button"
                      onClick={() => handleInitTransfer(collection.id)}
                    >
                      โอนกรรมสิทธิ์
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#fff" }}>
              ยังไม่มีคอลเล็กชันที่อนุมัติแล้ว
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCollectionPage;
