import Elysia from "elysia";
import DOMPurify from "isomorphic-dompurify";

export const sanitizeBody = new Elysia()
    .derive({as: 'scoped'},({ body }) => {
    if (body && typeof body === "object") {

      const sanitized = Object.fromEntries(
        Object.entries(body).map(([key, value]) =>
          typeof value === "string" ? [key, DOMPurify.sanitize(value)] : [key, value]
        )
      );

      // Attach sanitized body as a new property
      return { sanitizedBody: sanitized };
    }
    return {};
  });

