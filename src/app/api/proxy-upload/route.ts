import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const prefix = (formData.get("prefix") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // El prefijo ya debe incluir el slash final si no es vacío
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, "0")}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getFullYear().toString().slice(-2)}`;
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const uniqueFilename = `${prefix}${dateStr}-${randomSuffix}-${file.name}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFilename,
      Body: buffer,
      ContentType: file.type,
    });

    await r2.send(command);

    return NextResponse.json({
      url: `${R2_PUBLIC_URL}/${uniqueFilename}`,
      key: uniqueFilename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
