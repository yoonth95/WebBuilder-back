const fs = require('fs');
const path = require('path');

exports.uploadImage = (req, res) => {
  try {
    const urlPath = req.files['image'][0].path.replace(/\\/g, '/');
    const host = req.headers.host;
    const imageUrl = `http://${host}/${urlPath}`;

    res.status(200).send({ filePath: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json('이미지 업로드 오류');
  }
};

exports.deleteImage = (req, res) => {
  const { imageUrl } = req.body;
  const imagePathInServer = imageUrl.split(`http://${req.headers.host}`)[1];  // '/static/images/editor_thinkbig_search_60_1691164054809.png'
  const actualFilePath = path.join(__dirname, '../', imagePathInServer); // '../' should be replaced with the actual root directory of your server.

  // 파일이 실제로 존재하는지 확인합니다.
  // fs.access(actualFilePath, fs.constants.F_OK, (err) => {
  //   if (err) {
  //     console.error(`${actualFilePath} 파일이 존재하지 않습니다.`);
  //     return res.status(400).send({ message: `${actualFilePath} 파일이 존재하지 않습니다.` });
  //   } else {
  //     // 파일이 존재하므로 삭제를 수행합니다.
  //     fs.unlink(actualFilePath, (err) => {
  //       if (err) {
  //         console.error(err);
  //         return res.status(500).send({ message: '삭제 실패' });
  //       } else {
  //         return res.status(200).send({ message: '삭제 성공' });
  //       }
  //     });
  //   }
  // });
};