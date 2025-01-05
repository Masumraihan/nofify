//import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { Request } from "express";
import fs from "fs";
import multer from "multer";
import config from "../config";

//cloudinary.config({
//  cloud_name: config.cloudinaryName,
//  api_key: config.cloudinaryApiKey,
//  api_secret: config.cloudinaryApiSecret,
//});

//const sendImageToCloudinary = (imageName: string, path: string): Promise<UploadApiResponse> => {
//  return new Promise((resolve, reject) => {
//    cloudinary.uploader.upload(path, { public_id: imageName }, function (error, result) {
//      if (error) {
//        reject(error);
//      }
//      resolve(result as UploadApiResponse);

//      // DELETE TEAM IMAGE FROM "uploads" FOLDER
//      fs.unlink(path, (err) => {
//        if (err) {
//          reject(err);
//        } else {
//          console.log("Temp image file deleted from uploads folder");
//        }
//      });
//    });
//  });
//};

const storage = multer.diskStorage({
  destination: function (req: Request, file, cb) {
    // check is upload folder exist or not
    if (!fs.existsSync(process.cwd() + "/uploads")) {
      fs.mkdirSync(process.cwd() + "/uploads");
    }
    cb(null, process.cwd() + "/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

export const fileUploader = {
  upload,
  //sendImageToCloudinary,
};
