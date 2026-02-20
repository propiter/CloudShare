import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { r2, R2_BUCKET_NAME } from "@/lib/r2";

export async function GET() {
  try {
    const corsParams = {
      Bucket: R2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
            AllowedOrigins: ["*"], // En producción, limita esto a tu dominio
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3001,
          },
        ],
      },
    };

    const command = new PutBucketCorsCommand(corsParams);
    await r2.send(command);

    return NextResponse.json({
      success: true,
      message: "CORS configuration updated successfully",
    });
  } catch (error) {
    console.error("Error setting CORS:", error);
    return NextResponse.json(
      { error: "Failed to set CORS configuration", details: error },
      { status: 500 }
    );
  }
}
