const express = require("express");
const multer = require('multer');
const fs = require("fs");
const router = express.Router();
const imageController = require("../controllers/image-controller");

// multer 설정
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const pageId = file.originalname.split('_').at(-2); // 클라이언트에서 보낸 page_id
    const dir = `static/images/${pageId}`;

    // 해당 폴더가 존재하지 않으면 생성합니다.
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });  // recursive 옵션으로 필요한 중간 폴더들도 함께 생성합니다.
    }

    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
})

const upload = multer({ storage: storage }).fields([
  { name: 'image', maxCount: 1 },
  { name: 'page_id', maxCount: 1 }
]);

router.post('/uploadImage', upload, imageController.uploadImage);
router.post('/deleteImage', imageController.deleteImage)


module.exports = router;
