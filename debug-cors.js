const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3");

const R2_ACCOUNT_ID = "76f705daf2aab9d2ae67fbc6c6b4b8b4";
const R2_ACCESS_KEY_ID = "c0a41014e80ef3428ee1ba50bb15cf6b";
const R2_SECRET_ACCESS_KEY = "5db09fcb990331f36555ee698cc35d33fbff64f0ff0a59dff2019ff154f6725d";
const R2_BUCKET_NAME = "data";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function setCors() {
  try {
    console.log("Setting CORS...");
    const command = new PutBucketCorsCommand({
      Bucket: R2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
            AllowedOrigins: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });

    await r2.send(command);
    console.log("CORS set successfully!");
  } catch (error) {
    console.error("Error setting CORS:", error);
  }
}

setCors();
