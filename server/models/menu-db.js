const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db);
const commit = util.promisify(db.commit).bind(db);
const rollback = util.promisify(db.rollback).bind(db);

// 메뉴 가져오기
exports.getMenu = async (userID) => {
  try {
    const result = await query(`SELECT * FROM menus WHERE userID = ? order by order_num asc, idx asc`, userID);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.getMenuWithId = async (id) => {
  try {
    const result = await query(`SELECT * FROM menus WHERE idx = ?`, id);
    return result;
  } catch (err) {
    throw err;
  }
};

// 메뉴의 마지막 순서 가져오기
exports.getMenuLastOrder = async (data) => {
  try {
    const result = data[0]
      ? await query(`SELECT count(*) as count FROM menus where userID = ? and parent_id is null`, data[1])
      : await query(`SELECT count(*) as count FROM menus where userID = ? and parent_id = ?`, [data[2], data[1]])
    return result;
  } catch (err) {
    throw err;
  }
};

// 메뉴 삭제하기 (부모 메뉴 삭제 시 자식 메뉴까지 다 삭제)
exports.deleteMenu = async (idx, order_num, parent_id, userID) => {
  try {
    await beginTransaction(); // 트랜잭션 시작

    await query(`DELETE FROM menus where idx = ?`, idx);

    let result2;
    if (parent_id === "undefined") {
      result2 = await query(`UPDATE menus SET order_num = order_num - 1 WHERE userID = ? and parent_id is null and order_num > ?`, [userID, order_num])
    } else {
      result2 = await query(`UPDATE menus SET order_num = order_num - 1 WHERE userID = ? and parent_id = ? and order_num > ?`, [userID, parent_id, order_num])
    }

    await commit();   // 트랜잭션 수행

    return result2;
  } catch (err) {
    await rollback(); // 중간에서 에러 발생 시 rollback으로 트랜잭션 시작 지점으로 돌아가기
    throw err;
  }
};

// 임시로 만든 코드 data 값들 수정 해야 함
exports.insertMenu = async (data) => {
  try {
    await beginTransaction(); // 트랜잭션 시작

    let result;
    if (!data[0]) {
      result = await query("INSERT INTO menus (parent_id, title, link, origin_link, new_window, order_num, userID) VALUES (?, ?, ?, ?, ?, ?, ?)", [data[1], data[2], data[3], data[3], data[4], data[5], data[6]])
    } else {
      result = await query("INSERT INTO menus (title, order_num, userID) VALUES (?, ?, ?)", [data[1], data[2], data[3]]);
    }

    const lastId = result.insertId;

    const selectRow = await query(`SELECT * FROM menus WHERE idx = ?`, lastId);

    await commit();   // 트랜잭션 수행

    return selectRow;
  } catch (error) {
    await rollback(); // 중간에서 에러 발생 시 rollback으로 트랜잭션 시작 지점으로 돌아가기
    throw error; // 오류
  }
};

exports.updateMenu = async (idx, title, link, newWindow) => {
  try {
    const result = await query(`UPDATE menus SET title=?, link=?, new_window=? where idx = ?`, [title, link, newWindow, idx]);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.orderMenu = async (listData) => {
  try {
    console.time('순서 변경 db 업데이트 시간');

    await beginTransaction(); // 트랜잭션 시작 

    let updates = [];
    let placeholders = [];
    listData.forEach((item, index) => {
      updates.push(`WHEN ? THEN ?`);
      placeholders.push(item.idx, item.order_num);
    });

    let sql = `UPDATE menus SET order_num = CASE idx ${updates.join(' ')} END WHERE idx IN (?)`;
    await query(sql, [...placeholders, listData.map(item => item.idx)]);

    await commit();   // 트랜잭션 수행 

    console.timeEnd('순서 변경 db 업데이트 시간');
  } catch (error) {
    await rollback(); // 중간에서 에러 발생 시 rollback으로 트랜잭션 시작 지점으로 돌아가기
    throw error; // 오류
  }
}

// 에디터 블록 가져오기
exports.editMenu = async (idx) => {
  try {
    const result = await query(`SELECT * FROM blocks where idx = ?`, [idx]);
    return result;
  } catch (err) {
    throw err;
  }
};