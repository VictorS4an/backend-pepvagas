import multer, { Options } from "multer";
import path from "path";


export default {
    storage: multer.diskStorage({
      destination: path.join(".", "..", "..", "uploads"),
      filename(req, file, callback) {
        callback(null, `${Date.now()}-${file.originalname}`);
      },
    }),
    limits: {
      fileSize: 8 * 1024 * 1024, // 2MB
    },
    fileFilter: (req, file, cb) => {
      const mimeType = ["application/pdf", "image/png", "image/jpeg"];
  
      if (!mimeType.includes(file.mimetype)) {
        return cb(null, false);
      }
      cb(null, true);
    },
} as Options;