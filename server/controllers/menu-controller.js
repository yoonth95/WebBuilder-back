const menuDB = require("../models/menu-db");

exports.getMenu = async (req, res) => {
  const { userID } = req.params;

  try {
    const getMenu = await menuDB.getMenu(userID);
    res.status(200).json(getMenu);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

exports.getMenuWithId = async (req, res) => {
  const { userID, id } = req.params;

  try {
    const getMenu = await menuDB.getMenuWithId(id);
    res.status(200).json(getMenu);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};

exports.deleteMenu = async (req, res) => {
  const { id } = req.params;
  const [idx, order_num, parent_id, userID] = id.split("_");

  try {
    await menuDB.deleteMenu(idx, order_num, parent_id, userID);
    res.status(200).json('메뉴를 삭제하였습니다.');
  } catch (err) {
    console.error(err);
    res.status(500).json('삭제 오류');
  }
};

exports.insertMenu = async (req, res) => {
  const data = req.body;

  // 부모 추가
  if (!data.parent_id) {
    try {
      const getMenuLastOrder = await menuDB.getMenuLastOrder([true, data.userID]);
      const order_num = getMenuLastOrder[0].count + 1;
      const result = await menuDB.insertMenu([true, data.title, order_num, data.userID]);
      res.status(200).json(result[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json('추가 오류');
    }
  }
  // 자식 추가
  else {
    try {
      const getMenuLastOrder = await menuDB.getMenuLastOrder([false, data.parent_id, data.userID]);
      const order_num = getMenuLastOrder[0].count + 1;
      const result = await menuDB.insertMenu([false, data.parent_id, data.title, data.link, data.new_window, order_num, data.userID]);
      res.status(200).json(result[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json('추가 오류');
    }
  }
};

exports.updateMenu = async (req, res) => {
  const { idx, title, link, new_window } = req.body;

  try {
    await menuDB.updateMenu(idx, title, link, new_window);
    res.status(200).json('메뉴를 수정하였습니다.');
  } catch (err) {
    console.error(err);
    res.status(500).json('수정 오류');
  }
};

exports.orderMenu = async (req, res) => {
  const { listData } = req.body;

  try {
    await menuDB.orderMenu(listData);
    res.status(200).json('순서 변경 완료');
  } catch (err) {
    console.error(err);
    res.status(500).json('순서 변경 오류');
  }
}

exports.editMenu = async (req, res) => {
  const { idx } = req.body;

  try {
    const editMenu = await menuDB.editMenu(idx);
    res.status(200).json(editMenu);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
};