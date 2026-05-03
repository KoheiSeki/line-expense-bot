import axios from "axios";
import { ApiError } from "./error";

export const apiClient = axios.create({
	baseURL: "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

/** Response Interceptor */
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		const status = error.response.status;
		const message = error.response?.data?.message || "エラーが発生しました";

		return Promise.reject(new ApiError(status, message));
	},
);
