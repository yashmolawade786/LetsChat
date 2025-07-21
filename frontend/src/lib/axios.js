import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://letschat-g8kl.onrender.com",
  withCredentials: true,
});
