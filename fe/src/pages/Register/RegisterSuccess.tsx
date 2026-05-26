import React from "react";
import { MailCheck } from "lucide-react";
import { Link } from "react-router-dom";
import "./RegisterSuccess.css";
import successBg from "../../assets/background/register-success.jpg"

const RegisterSuccess: React.FC = () => {
  return (
    <div className="register-success" style={{ backgroundImage: `url(${successBg})` }}>
      <div className="register-success__card">
        <div className="register-success__icon-wrapper">
          <MailCheck className="register-success__icon" />
        </div>

        <h1 className="register-success__title">
          Đăng ký thành công
        </h1>

        <p className="register-success__description">
          Tài khoản của bạn đã được tạo thành công.
          <br />
          Vui lòng kiểm tra email để <strong>kích hoạt tài khoản</strong>.
        </p>

        <div className="register-success__info">
          Hãy kiểm tra cả mục <strong>Spam / Thư rác</strong> nếu bạn chưa thấy email.
        </div>

        <Link to="/login" className="register-success__button">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default RegisterSuccess;
