import { LRUCache } from "lru-cache";
import Role from "../models/Role.js";

import { norm } from "../utils/norm.js";

export default function authorize(...required) {
    const requiredNorm = norm(required);
    return async (req, res, next) => {
        if (!req.user?.sub) return res.status(401).json({ message: "Unauthorized" });

        try {
            const dbRoles = await getDbRoles(req.user.sub);

            if (Array.isArray(req.user.roles)) {
                const claimed = norm(req.user.roles);
                const tampered = claimed.some(r => !dbRoles.includes(r));
                if (tampered) return res.status(403).json({ message: "Role mismatch. Please sign in again." });
            }

            if (requiredNorm.length) {
                const ok = requiredNorm.some(r => dbRoles.includes(r));
                if (!ok) return res.status(403).json({ message: "Forbidden" });
            }

            return next();

        } catch (err) {
            return res.status(500).json({ message: "Role check failed" });
        }
    };
}

const cache = new LRUCache({ max: 1000, ttl: 60_000 });

async function getDbRoles(userId) {
    const cached = cache.get(userId);
    if (cached) return cached;
    const rows = await Role.find({ user_id: userId }).select("role -_id").lean();
    const roles = norm(rows.map(r => r.role));
    cache.set(userId, roles);
    return roles;
}