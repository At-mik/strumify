import { axiosClient } from "./api";

export const fetchCoursesRequest = async () => {
  try {
    const { data } = await axiosClient.get("/courses");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("API fetchCourses failed", error);
    throw error;
  }
};

export const fetchCourseModulesRequest = async (courseId) => {
  try {
    const { data } = await axiosClient.get(`/courses/${courseId}/modules`);
    return {
      course: data?.course || null,
      modules: Array.isArray(data?.modules) ? data.modules : []
    };
  } catch (error) {
    console.error("API fetchCourseModules failed", error);
    throw error;
  }
};

export const fetchModuleLessonsRequest = async (moduleId) => {
  try {
    const { data } = await axiosClient.get(`/modules/${moduleId}/lessons`);
    return {
      module: data?.module || null,
      lessons: Array.isArray(data?.lessons) ? data.lessons : []
    };
  } catch (error) {
    console.error("API fetchModuleLessons failed", error);
    throw error;
  }
};
