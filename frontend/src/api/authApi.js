import { axiosClient } from "./api";

export const signupRequest = async (payload) => {
  try {
    const { data } = await axiosClient.post("/auth/signup", payload);
    return data || {};
  } catch (error) {
    console.error("API signup failed", error);
    throw error;
  }
};

export const loginRequest = async (payload) => {
  try {
    const { data } = await axiosClient.post("/auth/login", payload);
    return data || {};
  } catch (error) {
    console.error("API login failed", error);
    throw error;
  }
};
