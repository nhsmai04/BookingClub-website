import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type User } from "../../contexts/AuthContext";
import { logoutApi, updateMeApi, updatePasswordApi } from "../../services/auth.api"; 
import ChangeEmailModal from "../../components/common/ProfileModals/ChangeEmailModal";
import ChangePasswordModal from "../../components/common/ProfileModals/ChangePasswordModal";
import { Map, Award, Target, Lock, ShieldAlert, KeyRound, Mail } from 'lucide-react';
import defaultAvatar from "../../assets/avatar-placeholder.png"; 
import "./ProfilePage.css";
import SideBar from "../../components/common/SideBar/SideBar";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, loading } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Dọn dẹp URL ảo của ảnh preview để tránh rò rỉ bộ nhớ (memory leak)
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Đồng bộ dữ liệu từ Context (user) vào Local State (formData) để hiển thị/chỉnh sửa
  useEffect(() => {
    if (user) {
      setFormData(user);
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  // Bảo vệ route: Đẩy về trang đăng nhập nếu chưa có user
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Xử lý cập nhật state khi người dùng gõ vào các ô input text/date
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Kích hoạt click vào thẻ <input type="file"> (đang bị ẩn bằng CSS)
  const handleUploadClick = () => fileInputRef.current?.click();

  // Xử lý khi người dùng chọn file ảnh: Validate định dạng, dung lượng (<5MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) return alert("Vui lòng chọn file hình ảnh!");
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) return alert("Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
      
      setAvatarFile(file); 
      setAvatarPreview(URL.createObjectURL(file)); 
    }
  };

  // Xóa ảnh đang chọn và reset lại input file
  const handleDeleteAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null); 
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  // Kiểm tra xem người dùng có thực sự thay đổi dữ liệu nào không (để tránh gọi API thừa)
  const checkIsDirty = () => {
    if (!user) return false;
    if (avatarFile !== null) return true;
    if (avatarPreview === null && user.avatar_url) return true;
    if (formData.name !== user.name) return true;

    const originDob = user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : "";
    const formDob = formData.date_of_birth ? new Date(formData.date_of_birth).toISOString().split('T')[0] : "";
    if (formDob !== originDob) return true;

    return false;
  };

  // HÀM LƯU THÔNG TIN CƠ BẢN: Gom payload JSON, xử lý up ảnh, gọi API updateMe
  const handleSave = async () => {
    if (!checkIsDirty()) {
      setIsEditing(false);
      return; 
    }

    try {
      const payload: any = {
        name: formData.name,
      };

      if (formData.date_of_birth) {
        payload.date_of_birth = formData.date_of_birth;
      }

      if (avatarFile) {
        // Chỗ này đợi BE viết API đẩy ảnh lên Cloud lấy URL
        // const uploadUrl = await uploadToCloudinary(avatarFile);
        // payload.avatar_url = uploadUrl;
        console.log("File ảnh đang chọn:", avatarFile.name);
      } else if (avatarPreview === null) {
        payload.avatar_url = ""; // Truyền string rỗng để xóa ảnh trên BE
      }
      
      await updateMeApi(payload);

      setUser({ ...user, ...formData, avatar_url: payload.avatar_url || avatarPreview } as User); 
      setIsEditing(false); 
      alert("Cập nhật hồ sơ thành công!");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Lỗi khi cập nhật hồ sơ!");
    }
  };

  // Hủy chế độ chỉnh sửa, khôi phục lại dữ liệu ban đầu
  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData(user); 
      setAvatarPreview(user.avatar_url || null); 
      setAvatarFile(null);
    }
  };

  // HÀM LƯU MẬT KHẨU: Nhận payload từ Modal và gọi API updatePassword
  const handleUpdatePassword = async (data: any) => {
    try {
      await updatePasswordApi(data);
      
      alert("Đổi mật khẩu thành công!");
      setIsPwdModalOpen(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Đã có lỗi xảy ra khi đổi mật khẩu");
    }
  };

  // HÀM ĐỔI EMAIL: Nhận payload từ Modal (API BE hiện chưa hỗ trợ nên tạm để log)
  const handleUpdateEmail = async (data: any) => {
    console.log("Bắn API PUT /update với payload chứa email và password:", data);
    alert("Giao diện đổi Email đã sẵn sàng, chờ BE cập nhật API!");
    setIsEmailModalOpen(false);
  };

  // Xác nhận đăng xuất, xóa token ở storage và đẩy về trang Login
  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      try { await logoutApi(); } catch (e) {}
      sessionStorage.clear();
      setUser(null);
      document.cookie = "csrf_token_fe=; path=/; max-age=0; SameSite=None; Secure=true";
      navigate("/login");
    }
  };

  // Hàm tiện ích: Ép kiểu dữ liệu Date (hoặc string iso) về chuẩn YYYY-MM-DD cho input type="date"
  const getFormattedDateForInput = (dateValue: Date | string | undefined) => {
    if (!dateValue) return "";
    try {
      return new Date(dateValue).toISOString().split('T')[0];
    } catch (error) {
      return "";
    }
  };

  if (loading) return <div className="loading-container">Đang tải dữ liệu...</div>;
  if (!user) return null;

  return (
    <div className="profile-wrapper">
        <SideBar />
      <div className="profile-container">
        
        <div className="profile-header">
          <h2>Thiết lập hồ sơ cá nhân</h2>
          {!isEditing && (
            <button className="btn-update-mode" onClick={() => setIsEditing(true)}>Cập nhật cơ bản</button>
          )}
        </div>

        <div className="profile-table">
          <div className="section-title">Thông tin cơ bản</div>

          <div className="profile-row">
            <div className="profile-col-label">Ảnh đại diện</div>
            <div className="profile-col-value avatar-col">
              <div className="avatar-circle">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="avatar-img" />
                  ) : (
                    <img src={defaultAvatar} alt="Default Avatar" className="avatar-img" />
                  )}
                </div>
              {isEditing && (
                <div className="avatar-actions">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden-file-input" />
                  <button className="btn-upload" onClick={handleUploadClick}>Tải lên</button>
                  <button className="btn-delete" onClick={handleDeleteAvatar}>Xóa</button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-col-label">Tên hiển thị</div>
            <div className="profile-col-value">
              {isEditing ? (
                <input type="text" name="name" value={formData.name || ""} onChange={handleChange} className="edit-input" />
              ) : (
                <span className="read-only-text">{user.name}</span>
              )}
            </div>
          </div>

          <div className="profile-row mb-20">
            <div className="profile-col-label">Ngày sinh</div>
            <div className="profile-col-value">
              {isEditing ? (
                <input 
                  type="date" 
                  name="date_of_birth" 
                  value={getFormattedDateForInput(formData.date_of_birth)} 
                  onChange={handleChange} 
                  className="edit-input" 
                />
              ) : (
                <span className="read-only-text">
                  {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('vi-VN') : "Chưa cập nhật"}
                </span>
              )}
            </div>
          </div>

          <div className="section-title">Thông bảo mật <ShieldAlert size={18} color="#ef4444" /></div>

          <div className="profile-row">
            <div className="profile-col-label">Mật khẩu</div>
            <div className="profile-col-value between">
              <span className="read-only-text pwd-dots">••••••••</span>
              {!isEditing && (
                <button className="btn-inline-action security" onClick={() => setIsPwdModalOpen(true)}>
                  <KeyRound size={16} /> Đổi mật khẩu
                </button>
              )}
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-col-label">Email</div>
            <div className="profile-col-value between">
              <span className="read-only-text email-text">{user.email}</span>
              {!isEditing && (
                <button className="btn-inline-action" onClick={() => setIsEmailModalOpen(true)}>
                  <Mail size={14} /> Sửa
                </button>
              )}
            </div>
          </div>

          <div className="profile-row mb-20">
            <div className="profile-col-label">Số điện thoại</div>
            <div className="profile-col-value between">
              <span className="read-only-text">{user.phone || "Chưa cập nhật"}</span>
              {!isEditing && (
                <button 
                  className="btn-inline-action"
                  onClick={() => alert("Tính năng đổi Số điện thoại cần xác thực mã OTP (Đang phát triển)")}
                >
                  <Lock size={14} /> Sửa
                </button>
              )}
            </div>
          </div>

          <div className="section-title">Hồ sơ thể thao (Đang phát triển)</div>
          <div className="profile-row">
            <div className="profile-col-label" style={{ backgroundColor: '#6b7280' }}>Cá nhân hóa</div>
            <div className="profile-col-value personal-col" style={{ borderColor: '#6b7280' }}>
              <div className="personal-item">
                <Map size={16} />
                <div className="personal-info">
                  <strong>Vị trí:</strong>
                  <span>{user.location || "Chưa có dữ liệu"}</span>
                </div>
              </div>
              <div className="personal-item">
                <Award size={16} />
                <div className="personal-info">
                  <strong>Trình độ:</strong>
                  <span>{user.sportLevel || "Chưa có dữ liệu"}</span>
                </div>
              </div>
              <div className="personal-item">
                <Target size={16} />
                <div className="personal-info">
                  <strong>Mục tiêu:</strong>
                  <span>{user.goal || "Chưa có dữ liệu"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="profile-footer">
            <button className="btn-cancel-action" onClick={handleCancel}>Hủy</button>
            <button className="btn-save-action" onClick={handleSave}>Lưu thay đổi</button>
          </div>
        )}
        
        {!isEditing && (
          <div className="profile-logout-wrapper">
            <button className="btn-logout" onClick={handleLogout}>Đăng Xuất</button>
          </div>
        )}
      </div>

      {isPwdModalOpen && (
        <ChangePasswordModal 
          onClose={() => setIsPwdModalOpen(false)} 
          onSave={handleUpdatePassword} 
        />
      )}

      {isEmailModalOpen && (
        <ChangeEmailModal 
          currentEmail={user.email}
          onClose={() => setIsEmailModalOpen(false)} 
          onSave={handleUpdateEmail} 
        />
      )}

    </div>
  );
};

export default ProfilePage;