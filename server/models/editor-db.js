const util = require("util");
const db = require("../database/db"); // 데이터베이스 연결 설정

const query = util.promisify(db.query).bind(db);
const beginTransaction = util.promisify(db.beginTransaction).bind(db);
const commit = util.promisify(db.commit).bind(db);
const rollback = util.promisify(db.rollback).bind(db);

// 에디터 블록 가져오기
exports.getBlocks = async (idx) => {
    try {
        const result = await query(`SELECT page_id, block_id, block_style, design_type, design_id, layout_design, content, block_order FROM blocks WHERE page_id=? ORDER BY block_order asc`, idx);
        return result;
    } catch (err) {
        throw err;
    }
};

// 에디터 백업 블록 가져오기
exports.getBlocksBackup = async (idx, save_time) => {
    try {
        const result = await query(`SELECT page_id, block_id, block_style, design_type, design_id, layout_design, content, block_order, save_time FROM block_backup WHERE page_id=? and save_time=? ORDER BY block_order asc`, [idx, save_time]);
        return result;
    } catch (err) {
        throw err;
    }
};

// 에디터 백업 블록 save_time 가져오기
exports.getBlocksBackupSaveTime = async (idx) => {
    try {
        const result = await query(`SELECT save_time FROM block_backup WHERE page_id=? ORDER BY save_time desc`, idx);
        return result;
    } catch (err) {
        throw err;
    }
};


// 에디터 블록 추가
exports.insertBlock = async (page_id, block_id, block_style, design_type, design_id, layout_design, block_order) => {
    try {
        const result = await query(`INSERT INTO blocks (page_id, block_id, block_style, design_type, design_id, layout_design, block_order) VALUES (?, ?, ?, ?, ?, ?, ?)`, [page_id, block_id, block_style, design_type, design_id, layout_design, block_order]);
        return result;
    } catch (err) {
        throw err;
    }
};

// 에디터 블록 순서 변경
exports.orderBlock = async (block_id, block_order) => {
    try {
        const result = await query(`UPDATE blocks SET block_order=? WHERE block_id=?`, [block_order, block_id]);
        return result;
    } catch (err) {
        throw err;
    }
}

// 에디터 블록 디자인 변경
exports.updateBlockDesign = async (block_id, design_type, design_id, content) => {
    try {
        const result = await query(`UPDATE blocks SET design_type=?, design_id=?, content=? WHERE block_id=?`, [design_type, design_id, content, block_id]);
        return result;
    } catch (err) {
        throw err;
    }
}

// 에디터 전체 블록 삭제
exports.deleteAllBlocks = async (page_id) => {
    try {
        const result = await query(`DELETE FROM blocks where page_id = ?`, page_id);
        return result;
    } catch (err) {
        throw err;
    }
}

// 에디터 블록 삭제
exports.deleteBlock = async (block_id) => {
    try {
        const result = await query(`DELETE FROM blocks where block_id = ?`, block_id);
        return result;
    } catch (err) {
        throw err;
    }
}

// 에디터 블록 레이아웃 변경
exports.updateBlockLayout = async (block_id, layout_design) => {
    try {
        await beginTransaction(); // 트랜잭션 시작

        let getLayoutDesign = [];
        const result = await query(`SELECT layout_design FROM blocks WHERE block_id=?`, block_id);

        if (result[0].layout_design !== null) {
            getLayoutDesign = [...JSON.parse(Buffer.from(Buffer.from(result[0].layout_design).toString('utf-8'), 'base64').toString('utf-8'))];
            if (getLayoutDesign.filter(item => item.layout_id === layout_design.layout_id).length > 0) {
                const newLayoutDesign = getLayoutDesign.map(item => item.layout_id === layout_design.layout_id ? item = layout_design : item);
                getLayoutDesign = [...newLayoutDesign];
            } else {
                getLayoutDesign.push(layout_design);
            }
        } else {
            getLayoutDesign.push(layout_design);
        }

        const result2 = await query(`UPDATE blocks SET layout_design=? WHERE block_id=?`, [btoa(unescape(encodeURIComponent(JSON.stringify(getLayoutDesign)))), block_id]);

        await commit(); // 트랜잭션 커밋

        return result2;
    } catch (err) {
        await rollback(); // 트랜잭션 롤백
        throw err;
    }
}

// 에디터 블록 저장
exports.saveBlock = async (page_idx, blocks, save_time) => {
    try {
        await beginTransaction(); // 트랜잭션 시작 

        // menus 테이블 save_time 업데이트 (null일 경우만)
        await query(`UPDATE menus SET save_time=? WHERE idx=?`, [save_time, page_idx]);

        // Promise.all()을 사용하여 비동기 처리
        await Promise.all([
            // block_backup 테이블 insert
            ...blocks.map(item => 
                query(`INSERT INTO block_backup (page_id, block_id, block_style, design_type, design_id, layout_design, content, block_order, save_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [page_idx, item.block_id, item.block_style, item.design_type, item.design_id, item.layout_design, item.content, item.block_order, save_time]
                )
            ),
            // blocks 테이블 업데이트
            ...blocks.map(item => 
                query(`UPDATE blocks SET block_style=?, design_type=?, design_id=?, layout_design=?, content=?, block_order=? WHERE page_id=? and block_id=?`, 
                [item.block_style, item.design_type, item.design_id, item.layout_design, item.content, item.block_order, page_idx, item.block_id]
                )
            )
        ]);

        await commit();   // 트랜잭션 수행 

        return true;
    } catch (err) {
        await rollback(); // 트랜잭션 롤백
        throw err;
    }
}

// 에디터 블록 복사
exports.copyDesign = async (page_idx, blocks) => {
    try {
        await beginTransaction(); // 트랜잭션 시작 

        blocks.forEach(async item => {
            await query(`INSERT INTO blocks (page_id, block_id, block_style, design_type, design_id, layout_design, content, block_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [page_idx, item.block_id, item.block_style, item.design_type, item.design_id, item.layout_design, item.content, item.block_order]);
        });

        await commit();   // 트랜잭션 수행 

        return true;
    } catch (err) {
        await rollback(); // 트랜잭션 롤백
        throw err;
    }
}

// menu 테이블 save_time 업데이트
exports.changeMenuSaveTimeAPI = async (page_idx, save_time) => {
    try {
        const result = await query(`UPDATE menus SET save_time=? WHERE idx=?`, [save_time, page_idx]);
        return result;
    } catch (err) {
        throw err;
    }
}

exports.updateBlock = async (page_idx, blocks) => {
    try {
        await beginTransaction(); // 트랜잭션 시작
    
        await query(`DELETE FROM blocks where page_id = ?`, page_idx);
    
        blocks.forEach(async item => {
            await query(`INSERT INTO blocks (page_id, block_id, block_style, design_type, design_id, layout_design, content, block_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [page_idx, item.block_id, item.block_style, item.design_type, item.design_id, item.layout_design, item.content, item.block_order]);
        });
    
        await commit();
        return true;
    } catch (err) {
        await rollback();
        throw err;
    }
}