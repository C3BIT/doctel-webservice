const { S3Client } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");

dotenv.config();

const s3Client = new S3Client({
  forcePathStyle: false,
  endpoint: "https://sgp1.digitaloceanspaces.com",
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
});

module.exports = s3Client;
