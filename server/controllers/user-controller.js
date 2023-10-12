const bcrypt = require("bcrypt"); // npm install bcrypt
const userDB = require("../models/user-db");
const jwt = require("jsonwebtoken");

const textToHash = async (text) => {
  const saltRounds = 10;

  try {
    const hash = await bcrypt.hash(text, saltRounds);
    return hash;
  } catch (err) {
    console.error(err);
    return err;
  }
};

exports.signup = async (req, res) => {
  const { userName, userID, userPW } = req.body;

  try {
    const getUser = await userDB.getUser(userID);
    if (getUser.length) {
      res.status(401).json("이미 존재하는 아이디입니다.");
      return;
    }

    const hash = await textToHash(userPW);
    const signUp = await userDB.signUp([userName, userID, hash]);
    res.status(200).json("가입 성공");
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

const hashCompare = async (inputValue, hash) => {
  try {
    const isMatch = await bcrypt.compare(inputValue, hash);
    if (isMatch) return true;
    else return false;
  } catch (err) {
    console.error(err);
    return err;
  }
};

exports.login = async (req, res) => {
  const { userID, userPW } = req.body;
  try {
    const getUser = await userDB.getUser(userID);
    if (!getUser.length) {
      res.status(401).json("존재하지 않는 아이디입니다.");
      return;
    }

    const blobToStr = Buffer.from(getUser[0].userPW).toString();
    const isMatch = await hashCompare(userPW, blobToStr);

    if (!isMatch) {
      res.status(401).json("비밀번호가 일치하지 않습니다.");
      return;
    }

    // JWT 생성
    const token = jwt.sign(
      {
        user_idx: getUser[0].idx,
        userID: getUser[0].userID,
        userName: getUser[0].userName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // JWT 유효기간 설정
    );

    // JWT를 HTTP Only 쿠키로 설정하여 응답
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: 'None', 
      secure: true
    });

    res.status(200).json({
      user_idx: getUser[0].idx,
      user_id: getUser[0].userID,
      user_name: getUser[0].userName,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};

exports.verifyToken = (req, res) => {
  const token = req.cookies?.token;

  let result = {
    isLogin: false,
    user: null,
  };

  if (!token) {
    result.isLogin = false;
    return res.status(401).json(result);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      res.clearCookie("token");
      result.isLogin = false;
      return res.status(401).json(result);
    }
    result.isLogin = true;
    result.user = decoded;
    res.status(200).json(result);
  });
};


exports.getUserId = async (req, res) => {
  const { idx } = req.params;

  try {
    const UserId = await userDB.getUserId(idx);
    res.status(200).json(UserId);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};