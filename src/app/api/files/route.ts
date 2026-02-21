import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/lib/r2";

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 100, // Limitar a 100 archivos por ahora, se podría paginar
    });

    const response = await r2.send(command);

    const files = response.Contents?.filter((item) => !item.Key?.endsWith("/")).map((item) => ({
      key: item.Key,
      lastModified: item.LastModified,
      size: item.Size,
      // Codificar correctamente cada segmento de la URL para manejar espacios y caracteres especiales
      url: `${R2_PUBLIC_URL}/${item.Key?.split('/').map(encodeURIComponent).join('/')}`,
    })) || [];

    // Ordenar por fecha de modificación descendente
    files.sort((a, b) => {
      if (a.lastModified && b.lastModified) {
        return b.lastModified.getTime() - a.lastModified.getTime();
      }
      return 0;
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
