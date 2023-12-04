const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "d2ugyri9xuir08.cloudfront.net",
    // origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use('/static/images', express.static('static/images'));

const routesPath = path.join(__dirname, "/routes"); // 라우트 파일들이 있는 디렉토리 경로

// 라우트 파일들을 모두 읽어서 각각을 Express 앱에 등록
fs.readdirSync(routesPath).forEach((file) => {
  const route = require(path.join(routesPath, file));
  app.use("/api", route);
});

app.listen(3001, () => {
  console.log("서버 실행");
});
