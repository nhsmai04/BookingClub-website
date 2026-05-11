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
  role: string;
}

const getMeApi = (): Promise<User> => {
  return axios.post("/api/v1/me");
};

interface LogoutResponse {
  message: string;
}

const logoutApi = (): Promise<LogoutResponse> => {
  
  return axios.post("/api/v1/logout");
};

export {
  createUserApi,
  loginApi,
  getMeApi,
  logoutApi
};
