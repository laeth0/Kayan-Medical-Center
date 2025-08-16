import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../lib/apiClient";
import { ROLES } from "../constant";

const ROLE_PATHS = Object.freeze({
    [ROLES.ADMIN]: "/admin",
    [ROLES.DOCTOR]: "/doctor/appointments",
    [ROLES.FINANCE]: "/finance",
    [ROLES.PATIENT]: "/patient/appointments",
});

const ROLE_PRIORITY = [ROLES.ADMIN, ROLES.DOCTOR, ROLES.FINANCE, ROLES.PATIENT];

function landingPath(roles = []) {

    const mainPath = "/";
    const r = roles.map((x) => String(x).toLowerCase());

    for (const role of ROLE_PRIORITY) {
        if (r.includes(role)) {
            return ROLE_PATHS[role];
        }
    }

    return mainPath;
}


export const AuthContext = createContext(null);


function isExpired(decoded) {
    if (!decoded?.exp) return false;
    return decoded.exp * 1000 <= Date.now();
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [claims, setClaims] = useState(null);
    const [ready, setReady] = useState(false);

    function applyToken(t) {
        setToken(t);
        if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
        else delete api.defaults.headers.common.Authorization;
    }

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const saved = localStorage.getItem("token");
                if (saved) {
                    try {
                        const { token: t } = JSON.parse(saved);
                        const c = jwtDecode(t);
                        if (!isExpired(c)) {
                            if (!mounted) return;
                            applyToken(t);
                            setClaims(c);
                            return;
                        } else {
                            localStorage.removeItem("token");
                        }
                    } catch {
                        localStorage.removeItem("token");
                    }
                }

                try {
                    const { data } = await api.post("/refresh-token", null, { withCredentials: true });
                    const t = data.accessToken;
                    const c = jwtDecode(t);
                    if (!mounted) return;
                    applyToken(t);
                    setClaims(c);
                } catch {
                    if (!mounted) return;
                    applyToken(null);
                    setClaims(null);
                }
            } finally {
                if (mounted) setReady(true);
            }
        })();

        return () => { mounted = false; };
    }, []);

    async function login(email, password, remember) {
        const { data } = await api.post("/login", { email, password }, { withCredentials: true });
        const t = data.accessToken;
        const c = jwtDecode(t);
        applyToken(t);
        setClaims(c);

        if (remember) {
            localStorage.setItem("token", JSON.stringify({ token: t }));
        } else {
            localStorage.removeItem("token");
        }

        return landingPath(c.roles || []);
    }

    async function logout() {
        try { await api.post("/logout", null, { withCredentials: true }); } catch { }
        localStorage.removeItem("token");
        applyToken(null);
        setClaims(null);
    }

    const value = useMemo(() => ({
        ready,
        token,
        claims,
        roles: claims?.roles || [],
        userId: claims?.sub || null,
        isAuthenticated: !!token,
        login,
        logout,
        landingPath,
    }), [ready, token, claims]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

