import bcrypt from "bcryptjs";


export function hashPassword(plain) {
    return bcrypt.hash(plain, 12);
}


export function verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}
