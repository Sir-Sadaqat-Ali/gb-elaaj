import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: "https://8b30e80794195332ebe8c0884ed656ad.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const bucket = "gb-elaaj-uploads";

console.log("Configuring CORS on", bucket, "…");
await client.send(new PutBucketCorsCommand({
  Bucket: bucket,
  CORSConfiguration: {
    CORSRules: [{
      AllowedOrigins: [
        "https://gb-elaaj.vercel.app",
        "https://app.gbelaaj.pk",            // future custom domain
        "http://localhost:3000",             // dev
      ],
      AllowedMethods: ["PUT", "GET", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    }],
  },
}));
console.log("✓ CORS rules applied");

const got = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
console.log("Verified rules:");
console.log(JSON.stringify(got.CORSRules, null, 2));
