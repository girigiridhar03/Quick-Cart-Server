import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req, file, callback) {
    const allowedTypes = [
      "image/webp",
      "image/jpeg",
      "image/png",
      "image/avif",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Only JPEG,PNG,WEBP,AVIF allowed", false));
    }
  },
});

export default upload;
