// src/context/userContext.jsx
import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const UserContext = createContext();

const USER_CACHE_KEY = "user:profile";

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //Logout user dari aplikasi
  const clearUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem(USER_CACHE_KEY);
  }, []);

  //Simpan juga user ke sessionStorage biar masih ada cache sementara.
  const updateUser = useCallback((userData) => {
    if (!userData) return;
    setUser(userData);
    try {
      sessionStorage.setItem(
        USER_CACHE_KEY,
        JSON.stringify({ data: userData, ts: Date.now() })
      );
    } catch {}
  }, []);

  //Aplikasi pertama kali dibuka (cek apakah user masih login).
  //User melakukan refresh halaman.
  //Perlu memastikan data profil terbaru dari server.
  const refreshUser = useCallback(
    async (signal) => {
      const token = localStorage.getItem("token");
      if (!token) {
        clearUser();
        return null;
      }
      try {
        const res = await axiosInstance.get(API_PATHS.AUTH.GET_USER_PROFILE, { signal });
        const profile = res?.data ?? null;
        setUser(profile);
        try {
          sessionStorage.setItem(
            USER_CACHE_KEY,
            JSON.stringify({ data: profile, ts: Date.now() })
          );
        } catch {}
        return profile;
      } catch (error) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") return null;
        if (error?.isUnauthorized || error?.response?.status === 401) {
          clearUser();
        }
        console.error("Gagal mendapatkan profil user:", error);
        return null;
      }
    },
    [clearUser] //useCallback hanya mengontrol kapan fungsi di-recreate, bukan kapan fungsi dieksekusi
  );

  useEffect(() => {
    const ctrl = new AbortController(); //API bawaan JavaScript yang dipakai untuk membatalkan (cancel) operasi async, biasanya HTTP request.

    const bootstrap = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const cachedRaw = sessionStorage.getItem(USER_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (cached?.data) setUser(cached.data);
        } catch {}
      }

      await refreshUser(ctrl.signal);
      setLoading(false);
    };

    bootstrap();

    const onStorage = (e) => {
      if (e.key === "token") {
        const hasToken = !!localStorage.getItem("token"); //Tanda !! dipakai untuk mengubah suatu nilai jadi boolean murni (true atau false).
        if (!hasToken) clearUser();
        else refreshUser(ctrl.signal);
      }
    };
    //storage adalah event bawaan browser yang dipicu ketika localStorage atau sessionStorage berubah di tab lain.
    window.addEventListener("storage", onStorage); 

    return () => {
      ctrl.abort();
      window.removeEventListener("storage", onStorage); //logout di tab A → tab B juga auto logout.
    };
  }, [clearUser, refreshUser]);

  const value = useMemo(
    () => ({ user, loading, updateUser, clearUser, refreshUser }),
    [user, loading, updateUser, clearUser, refreshUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;


// import React, { createContext, useState, useEffect, useCallback } from "react";
// import axiosInstance from "../utils/axiosInstance";
// import { API_PATHS } from "../utils/apiPaths";

// export const UserContext = createContext();

// const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true); // loading saat fetch awal

//   // Fungsi untuk clear user
//   const clearUser = useCallback(() => {
//     setUser(null);
//     localStorage.removeItem("token");
//   }, []);

//   // Fungsi untuk update user dan simpan token
//   const updateUser = useCallback((userData) => {
//     setUser(userData);
//     if (userData.token) {
//       localStorage.setItem("token", userData.token);
//     }
//   }, []);

//   // Fetch user profile saat mount
//   useEffect(() => {
//     const fetchUser = async () => {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       try {
//         // pastikan axiosInstance attach token di header
//         const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_PROFILE);
//         setUser(response.data);
//       } catch (error) {
//         // hanya logout jika 401 Unauthorized
//         if (error.response?.status === 401) {
//           clearUser();
//         }
//         console.error("Failed to fetch user profile:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [clearUser]);

//   return (
//     <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

// export default UserProvider;
