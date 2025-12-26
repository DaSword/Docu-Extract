import { z } from "zod";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  jobs: {
    list: {
      method: "GET" as const,
      path: "/api/jobs",
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/jobs/:id",
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/jobs",
      input: z.object({
        name: z.string().min(1),
      }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/jobs/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  documents: {
    add: {
      method: "POST" as const,
      path: "/api/jobs/:jobId/documents",
      input: z.object({
        filename: z.string().min(1),
        objectPath: z.string().min(1),
        mimeType: z.string().min(1),
      }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/jobs/:jobId/documents/:docId",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  extraction: {
    process: {
      method: "POST" as const,
      path: "/api/jobs/:jobId/process",
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    status: {
      method: "GET" as const,
      path: "/api/jobs/:jobId/status",
      responses: {
        200: z.object({
          status: z.string(),
          progress: z.number(),
          documents: z.array(z.any()),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    list: {
      method: "GET" as const,
      path: "/api/jobs/:jobId/messages",
      responses: {
        200: z.array(z.any()),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    send: {
      method: "POST" as const,
      path: "/api/jobs/:jobId/messages",
      input: z.object({
        content: z.string().min(1),
      }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  uploads: {
    requestUrl: {
      method: "POST" as const,
      path: "/api/uploads/request-url",
      input: z.object({
        name: z.string(),
        size: z.number(),
        contentType: z.string(),
      }),
      responses: {
        200: z.object({
          uploadURL: z.string(),
          objectPath: z.string(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateJobInput = z.infer<typeof api.jobs.create.input>;
export type AddDocumentInput = z.infer<typeof api.documents.add.input>;
export type SendMessageInput = z.infer<typeof api.messages.send.input>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
