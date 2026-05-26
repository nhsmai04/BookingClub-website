import { useState } from "react";
import { Image, LoaderCircle } from "lucide-react";
import "./Login.css";
import InputField from "../../components/layout/InputField/InputField";
import { loginApi } from "../../services/auth.api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import loginBg from "../../assets/background/login-register-bg.jpg";
import loginPortrait from "../../assets/background/login-portrait.jpg";


const Login: React.FC = () => {
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { fetchMe } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  // State lưu thông báo lỗi
  const [errors, setErrors] = useState({ phone: "", password: "" });

  // Hàm validate khi bấm nút Đăng nhập
  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let newErrors = { phone: "", password: "" };
    let isValid = true;

    setMessage({ text: "", type: "" });

    // Validate Email
    if (!phone) {
      newErrors.phone = "Số điện thoại không được để trống";
      isValid = false;
    }

    // Validate Mật khẩu
    if (!password) {
      newErrors.password = "Mật khẩu không được để trống";
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {

      try {
        setIsLoading(true);
        const res = await loginApi(phone, password);
        sessionStorage.setItem(
          "csrf_token",
          res.csrfToken
        );
        if (res) {
          await fetchMe();
          setMessage({
            text: "Đăng nhập thành công",
            type: "success",
          });
          setTimeout(() => {
            navigate("/");
          }, 1000);
        }

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
    <div className="login-wrapper" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="login-card">
        {/* Left: Image placeholder */}
        <div className="login-image-placeholder">
          <img
            src={loginPortrait}
            alt="Register"
            className="register-image"
          />
        </div>

        {/* Right: Form */}
        <div className="login-form-section">
          <div className="login-form-box">
            <h2 className="login-title">Đăng nhập</h2>

            {/* Gọi Component */}
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

            <button type="button"
              className="login-btn"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            {isLoading ? (
              <div className="login-loading">
                <LoaderCircle className="login-loading__icon" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              message.text && (
                <div
                  className={`login-message login-message--${message.type}`}
                >
                  {message.text}
                </div>
              )
            )}
          </div>

          {/* Footer link */}
          <p className="login-footer-text">
            Bạn chưa có tài khoản?{" "}
            <a href="/register" className="login-link">
              Đăng ký
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;