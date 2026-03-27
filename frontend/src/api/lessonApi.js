import { axiosClient } from "./api";

export const completeLessonRequest = async ({ lessonId, practiceMinutes }) => {
  try {
    const { data } = await axiosClient.post("/lessons/complete", {
      lessonId,
      practiceMinutes
    });
    return data || {};
  } catch (error) {
    console.error("API completeLesson failed", error);
    throw error;
  }
};
