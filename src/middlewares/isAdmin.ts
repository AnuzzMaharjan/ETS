import { JwtPayload } from "../types";

export const isAdmin = (jwtPayload: JwtPayload, set: any) => {
    if (jwtPayload.role !== 'admin') {
        set.status = 401;
        throw new Error('Unauthorized! You are not an admin.');
    }
}

