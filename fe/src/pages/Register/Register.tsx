import { useState } from "react";
import { Image, LoaderCircle } from "lucide-react";
import InputField from "../../components/layout/InputField/InputField";
import "./Register.css";
import "./Register.css";
import { createUserApi } from "../../services/auth.api";
import { Link, useNavigate } from "react-router-dom";
import registerBg from "../../assets/background/login-register-bg.jpg";
import registerPortrait from "../../assets/background/register-portrait.jpg";


const Register: React.FC = () => {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);


  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegister = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let newErrors = { fullName: "", email: "", phone: "", password: "", confirmPassword: "" };
    let isValid = true;

    setMessage({ text: "", type: "" });

    if (!fullName.trim()) { newErrors.fullName = "Họ và tên không được để trống"; isValid = false; }

    if (!email) { newErrors.email = "Email không được để trống"; isValid = false; }
    else if (!email.includes("@")) { newErrors.email = "Email chưa đúng định dạng"; isValid = false; }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phone) { newErrors.phone = "Số điện thoại không được để trống"; isValid = false; }
    else if (!phoneRegex.test(phone)) { newErrors.phone = "Số điện thoại phải gồm 10 chữ số"; isValid = false; }

    let typesCount = 0;
    if (/[a-z]/.test(password)) typesCount++;
    if (/[A-Z]/.test(password)) typesCount++;
    if (/[0-9]/.test(password)) typesCount++;
    if (/[^a-zA-Z0-9]/.test(password)) typesCount++;

    if (!password) { newErrors.password = "Mật khẩu không được để trống"; isValid = false; }
    else if (password.length < 8) { newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự"; isValid = false; }
    else if (typesCount < 3) { newErrors.password = "Mật khẩu yếu! Phải chứa ít nhất 3 loại: chữ thường, chữ hoa, số, ký tự đặc biệt"; isValid = false; }

    if (!confirmPassword) { newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu"; isValid = false; }
    else if (confirmPassword !== password) { newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"; isValid = false; }

    setErrors(newErrors);

    if (isValid) {
      try {
        setIsLoading(true);
        await createUserApi(fullName, email, phone, password);
        setMessage({
          text: "Đăng ký hợp lệ! Vui lòng kiểm tra email để kích hoạt tài khoản.",
          type: "success",
        });
        setTimeout(() => {
          navigate("/register-success");
        }, 1000);
      } catch (error: any) {
        console.log(">>> error: ", error);

        const message =
          error?.response?.data?.message || "Có lỗi xảy ra";

        setMessage({
          text: message,
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="register-wrapper" style={{ backgroundImage: `url(${registerBg})` }}>
      <div className="register-card">
        {/* Left: Image placeholder */}
        <div className="register-image-placeholder">
          <img
            src={registerPortrait}
            alt="Register"
            className="register-image"
          />
        </div>

        {/* Right: Form */}
        <div className="register-form-section">
          <div className="register-form-box">
            <h2 className="register-title">Đăng ký</h2>

            {/* Gọi Component Con cho từng Input */}
            <InputField
              label="Họ và tên"
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={(val) => { setFullName(val); setErrors({ ...errors, fullName: "" }); }}
              error={errors.fullName}
            />

            <InputField
              label="Email"
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(val) => { setEmail(val); setErrors({ ...errors, email: "" }); }}
              error={errors.email}
            />

            <InputField
              label="Số điện thoại"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(val) => { setPhone(val); setErrors({ ...errors, phone: "" }); }}
              error={errors.phone}
            />

            <InputField
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(val) => { setPassword(val); setErrors({ ...errors, password: "" }); }}
              error={errors.password}
              isPassword={true}
            />

            <InputField
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(val) => { setConfirmPassword(val); setErrors({ ...errors, confirmPassword: "" }); }}
              error={errors.confirmPassword}
              isPassword={true}
            />

            <button type="button"
              className="register-btn"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
            {isLoading ? (
              <div className="register-loading">
                <LoaderCircle className="register-loading__icon" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              message.text && (
                <div className={`register-message register-message--${message.type}`}>
                  {message.text}
                </div>
              )
            )}
          </div>

          <p className="register-footer-text">
            Bạn đã có tài khoản?{" "}
            <Link to="/login" className="register-link">Đăng nhập</Link>
          </p>
          <p className="register-footer-text">
            <a href="/register-owner" className="register-owner-link">
              Bấm vào đây để đăng ký dành cho chủ sân
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;