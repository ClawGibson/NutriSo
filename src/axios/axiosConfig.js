import axios from "axios";

const URL = import.meta.env.VITE_API_URL;

const instance = axios.create({
  // baseURL: URL,
  baseURL: "https://web-production-4f0d.up.railway.app/api/v2/",
  timeout: 50000,
});

instance.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");

  config.headers.common["Authorization"] = `Bearer ${token}`;
  config.headers.common["Content-Type"] = "application/json";
  //console.log('Config: ', config);
  return config;
});

export default instance;
