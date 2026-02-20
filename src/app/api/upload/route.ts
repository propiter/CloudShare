import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const { filename, contentType, prefix = "" } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and content type are required" },
        { status: 400 }
      );
    }

    // Generar un nombre único para evitar colisiones, incluyendo el prefijo si existe
    // Formato: [prefix/]ddMMyy-random-filename
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, "0")}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getFullYear().toString().slice(-2)}`;
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const uniqueFilename = `${prefix}${dateStr}-${randomSuffix}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    // Generar URL prefirmada válida por 1 hora
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return NextResponse.json({
      uploadUrl: signedUrl,
      key: uniqueFilename,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
