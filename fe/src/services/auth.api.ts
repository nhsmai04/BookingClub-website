import axios from "../utils/axios.customize";

//register
const createUserApi = (
  name: string,
  email: string,
  phone: string,
  password: string
) => {
  const URL_API = "/api/v1/register";
  const data = {
    name,
    email,
    phone,
    password
  };
  return axios.post(URL_API, data);
};

//login
interface LoginResponse {
  access_token: string;
  phone: string;
  email: string;
  csrfToken: string;
}

const loginApi = (
  phone: string,
  password: string
): Promise<LoginResponse> => {
  const URL_API = "/api/v1/login";
  return axios.post(URL_API, { phone, password });
};

//get my infomation (getMe)
interface User {
  _id: string;
  email: string;
  phone: string;
  name: string;
  status: string;
  role: string;
  avatar_url: string;
  date_of_birth: Date;
}

const getMeApi = (): Promise<User> => {
  return axios.get("/api/v1/me");
};

interface LogoutResponse {
  message: string;
}

interface VerifyEmailResponse {
  message: string;
  user: User;
}

const logoutApi = (): Promise<LogoutResponse> => {
  
  return axios.post("/api/v1/logout");
};

const verifyEmailApi = (token: string): Promise<VerifyEmailResponse> => {
  return axios.get("/api/v1/verify-email", {
    params: { token }
  });
};

// Cập nhật thông tin cơ bản (Gửi JSON thuần)
const updateMeApi = (data: { name?: string; avatar_url?: string; date_of_birth?: string | Date }) => {
  return axios.put("/api/v1/me/update", data);
};

// Đổi mật khẩu
const updatePasswordApi = (data: any) => {
  return axios.patch("/api/v1/me/update-password", data);
};

export {
  createUserApi,
  loginApi,
  getMeApi,
  logoutApi,
  verifyEmailApi,
  updateMeApi,
  updatePasswordApi
};