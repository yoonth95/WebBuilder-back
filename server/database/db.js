// npm install dotenv
require("dotenv").config();

const mysql = require("mysql");

// 공유 db (데스크탑 db 사용 시)
// const conn = mysql.createConnection({
//   host: `${process.env.DB_HOST_SHARE}`,
//   port: "3306",
//   user: "udemy",
//   password: `${process.env.DB_PASSWORD_SHARE}`,
//   database: "udemy",
// });

// 개인 db (노트북 db 사용 시)
const conn = mysql.createConnection({
  host: `${process.env.DB_HOST}`,
  port: "3306",
  user: "root",
  password: `${process.env.DB_PASSWORD}`,
  database: "udemy",
});

conn.connect((err) => {
  if (err) console.log(err);
  else console.log("Connected to the database");
});

module.exports = conn;
