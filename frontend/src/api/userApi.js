import { axiosClient } from "./axiosClient";

export const fetchProfileRequest = async () => {
  try {
    const { data } = await axiosClient.get("/user/profile");
    return data && typeof data === "object" ? data : null;
  } catch (error) {
    console.error("API fetchProfile failed", error);
    throw error;
  }
};
