

import API from "./api";

export const authService = {
    // LOGIN
    login: async (identifier, password) => {
        const response = await API.post("/auth/login", {
            email: identifier,
            password
        });

        const { token, user } = response.data;

        // Save authentication data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        return user;
    },

    // GET CURRENT USER
    getCurrentUser: () => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
            return null;
        }

        try {
            return JSON.parse(user);
        } catch {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            return null;
        }
    },

    // LOGOUT
    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },

    // REGISTER
    register: async (userData) => {
        const response = await API.post("/auth/register", userData);
        return response.data;
    }
};
