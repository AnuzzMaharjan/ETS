import cookie from "@elysiajs/cookie";
import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";

// Actually this one is also used for user authentication

export const jwtPayloadMiddleware = new Elysia().use(jwt({
    name: 'jwt',
    secret: Bun.env.JWT_SECRET ?? ''
})).use(cookie({
    secret: Bun.env.COOKIE_SECRET ?? ''
})).derive({ as: 'scoped' }, async ({ jwt, cookie: { authorization }, set }) => ({
    jwtPayload: await payloadExtract(jwt, authorization?.value, set)
}))

const payloadExtract = async (jwt: any, value: string | undefined, set: any) => {
    const decoded = await jwt.verify(value?.startsWith('Bearer ') ? value.split(' ')[1] : value, Bun.env.JWT_SECRET ?? '');

    if (!decoded) {
        set.status = 401;
        throw new Error("Failed to authenticate! Please login again.");
    }
    return decoded;
}