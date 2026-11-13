import axios from 'axios'

const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true
});

// instance.defaults.headers.common['Authorization'] = AUTH_TOKEN;

function getCookie(name: string) {
    const cookie = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

// Add a request interceptor
instance.interceptors.request.use(
    function (config) {
        const method = (config.method || "get").toUpperCase();

        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
            // Read the same cookie the API validates. The old frontend mirror
            // could become stale when the backend refreshed auth cookies.
            const apiCsrfToken = getCookie("csrf_token");
            const csrfToken = /^[a-f0-9]{64}$/i.test(apiCsrfToken)
                ? apiCsrfToken
                : getCookie("csrf_token_fe");

            if (csrfToken) {
                config.headers = config.headers || {};
                config.headers["x-csrf-token"] = csrfToken;
            }
        }

        return config;
    },
    function (error) {
        // Do something with the request error
        return Promise.reject(error);
    },
);

// Add a response interceptor
instance.interceptors.response.use(
    function (response) {
        // Any status code that lies within the range of 2xx causes this function to trigger
        // Do something with response data
        if (response && response.data) return response.data;
        return response;
    },
    async function (error) {
        // Any status codes that fall outside the range of 2xx cause this function to trigger
        // Do something with response error
        const originalRequest = error.config;

        // Check if originalRequest and url exist
        if (!originalRequest || !originalRequest.url) {
            return Promise.reject(error);
        }

        // Nếu là refresh thì không retry nữa
        if (originalRequest.url.includes("/refresh")) {
            return Promise.reject(error);
        }

        if(originalRequest.url.includes("/login") || originalRequest.url.includes("/register")) {
            return Promise.reject(error);
        }

        if(originalRequest.url.includes("/me")) {
            return Promise.reject(error);
        }

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            
            originalRequest._retry = true;

            try {
                const refreshResponse = await instance.post("/api/v1/refresh", {}, {});
                if (refreshResponse?.csrfToken) {
                    const secure = window.location.protocol === "https:" ? "; Secure" : "";
                    document.cookie = `csrf_token_fe=${encodeURIComponent(refreshResponse.csrfToken)}; path=/; max-age=604800; SameSite=Lax${secure}`;
                }

                return instance(originalRequest);

            } catch (refreshError) {
                // refresh fail → logout
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    },
);

export default instance
