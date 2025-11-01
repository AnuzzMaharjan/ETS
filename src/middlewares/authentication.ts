export const authentication = async ({ jwt, authorization, set }: { jwt: any, set: any, authorization: { value: string | undefined } }) => {
    const authToken = authorization.value && authorization.value.startsWith('Bearer') ? authorization.value.split(' ')[1] : null;

    if (!authToken) {
        set.status = 400;
        throw new Error("No authorization token provided");
    }
    const decoded = await jwt.verify(authToken);
    if (!decoded) {
        set.status = 401;
        throw new Error("Failed to authenticate! Please login again.");
    }
}