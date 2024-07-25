const multer = require('multer');
const uuid = require('uuid').v4;
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '../Backend/uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = uuid();
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
  })
  
  const upload = multer({ storage })
  module.exports = upload 