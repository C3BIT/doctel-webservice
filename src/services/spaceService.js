const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../configs/s3Client");
const path = require("path");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const BUCKET_NAME = process.env.SPACES_BUCKET;

const getFolderName = (fileType) => {
  const folderMap = {
    image: "uploads/images",
    document: "uploads/documents",
    video: "uploads/videos",
  };

  return folderMap[fileType] || "uploads/misc";
};


const profileFileUpload = async (file) => {
  try {
    const fileName = `${crypto.randomBytes(8).toString("hex")}-${uuidv4()}${path.extname(file.originalname)}`;
    const key = `profiles/${fileName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    const fileUrl = `https://${BUCKET_NAME}.sgp1.digitaloceanspaces.com/${key}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("File upload failed");
  }
};
const prescriptionFileUpload = async (file) => {
  try {
    const fileName = `${crypto.randomBytes(8).toString("hex")}-${uuidv4()}${path.extname(file.originalname)}`;
    const key = `prescriptions/${fileName}`; // Store in prescriptions folder

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    const fileUrl = `https://${BUCKET_NAME}.sgp1.digitaloceanspaces.com/${key}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading prescription file:", error);
    throw new Error("Prescription file upload failed");
  }
};
module.exports = { profileFileUpload, getFolderName,prescriptionFileUpload };
