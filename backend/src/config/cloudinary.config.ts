import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

// Central place for Cloudinary config. Only image.service.ts should import
// this — same one-file-per-external-service rule that chain.service.ts /
// eas.config.ts follow for the blockchain.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
});

export { cloudinary };
