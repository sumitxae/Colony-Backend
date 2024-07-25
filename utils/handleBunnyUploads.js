const axios = require("axios");
const uuid = require("uuid").v4;
const fs = require("fs");
const path = require("path");
const BunnyStorage = require("bunnycdn-storage").default;

const bunnyStorage = new BunnyStorage(
  process.env.CDN_API_KEY,
  process.env.CDN_STORAGE_ZONE,
  "sg"
);

const handleBunnyUploads = async (file) => {
  const fileName = uuid() + path.extname(file.originalname);
  const filePath = file.path;

  const response = await bunnyStorage.upload(filePath, fileName);

  if (response.data) {
    return `https://colony.b-cdn.net/${fileName}`;
  }
  return false;
};

module.exports = { handleBunnyUploads };
