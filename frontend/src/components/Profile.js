import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Profile.css';
import { refreshAccessToken } from '../utils/auth';

const Profile = () => {
  const [userData, setUserData] = useState({});
  const [editing, setEditing] = useState(false); // ใช้สำหรับเปิด-ปิดฟอร์มแก้ไข
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    profile_picture: null, // สำหรับรูปโปรไฟล์
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/profile/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let profilePictureUrl = response.data.profile_picture;

        // ถ้า API ส่งมาเป็น path ให้เติม domain
        if (profilePictureUrl && !profilePictureUrl.startsWith('http')) {
          profilePictureUrl = `http://localhost:8000${profilePictureUrl}`;
        }

        setUserData({
          ...response.data,
          profile_picture: profilePictureUrl || '/profileicon.png', // ใช้ default image ถ้าไม่มี
        });

      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, profile_picture: e.target.files[0] }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const updateData = new FormData();
    updateData.append('first_name', formData.first_name);
    updateData.append('last_name', formData.last_name);
    updateData.append('phone_number', formData.phone_number);
    if (formData.profile_picture) {
      updateData.append('profile_picture', formData.profile_picture);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:8000/api/profile/update/', updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const fullProfilePictureUrl = response.data.profile_picture
        ? `http://localhost:8000${response.data.profile_picture}`
        : '/profileicon.png';

      setUserData({
        ...response.data,
        profile_picture: fullProfilePictureUrl,
      });
      setEditing(false);
      alert('อัปเดตข้อมูลสำเร็จ!');
    } catch (error) {
      if (error.response?.status === 401) {
        // ถ้า Token หมดอายุให้รีเฟรช Token
        const newToken = await refreshAccessToken();
        if (newToken) {
          await handleUpdate(e); // เรียกใช้ฟังก์ชันซ้ำ
        }
      } else {
        console.error('Error updating profile:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      }
    }
  };
  return (
    <div className="profile-page">
      <div className="profile-container">
        {!editing ? (
          <>
            <div className="profile-header">
              <img
                src={userData.profile_picture}
                alt="Profile Icon"
                className="profile-icon"
                onError={(e) => { e.target.src = "/profileicon.png"; }} // เปลี่ยนรูปเป็น default ถ้ารูปมีปัญหา
              />
              <h2>ข้อมูลของฉัน</h2>
            </div>
            <div className="profile-details">
              <p>
                <strong>ชื่อ:</strong> {userData.first_name} {userData.last_name}
              </p>
              <p>
                <strong>Email:</strong> {userData.email}
              </p>
              <p>
                <strong>เบอร์:</strong> {userData.phone_number || 'ไม่ระบุ'}
              </p>
            </div>
            <button
              className="edit-profile-btn"
              onClick={() => {
                setFormData({
                  first_name: userData.first_name || "",
                  last_name: userData.last_name || "",
                  phone_number: userData.phone_number || "",
                  profile_picture: null,
                });
                setEditing(true);
              }}
            >
              แก้ไขข้อมูล
            </button>
          </>
        ) : (
          <form className="edit-profile-form" onSubmit={handleUpdate}>
            <label>
              ชื่อ:
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              นามสกุล:
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              เบอร์โทรศัพท์:
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
              />
            </label>
            <label>
              รูปโปรไฟล์:
              <input type="file" name="profile_picture" onChange={handleFileChange} />
            </label>
            <button type="submit">บันทึก</button>
            <button type="button" onClick={() => setEditing(false)}>
              ยกเลิก
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;

