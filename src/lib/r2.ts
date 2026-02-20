import { S3Client } from "@aws-sdk/client-s3";

// Usamos valores dummy si las variables no existen (ej: durante el build de Docker)
// Esto evita que el build falle porque Next.js evalúa este archivo al compilar las rutas API.
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "build-dummy-id";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "build-dummy-key";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "build-dummy-secret";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "build-dummy-bucket";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://dummy.url";
