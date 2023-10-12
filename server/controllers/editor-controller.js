const fs = require('fs');
const path = require('path');
const editorDB = require("../models/editor-db");

// 에디터 블록 가져오기
exports.getBlocks = async (req, res) => {
    const { idx } = req.params;

    try {
        const getBlocks = await editorDB.getBlocks(idx);

        // const test = getBlocks.map((block) => {
        //     console.log(JSON.parse(Buffer.from(Buffer.from(block.content).toString('utf-8'), 'base64').toString('utf-8')))
        // });

        const result = getBlocks.map((block) => {
            const content = block.content
                ? JSON.parse(Buffer.from(Buffer.from(block.content).toString('utf-8'), 'base64').toString('utf-8'))
                : null;

            const layout_design = block.layout_design
                ? Buffer.from(Buffer.from(block.layout_design).toString('utf-8'), 'base64').toString('utf-8')
                : null;

            return {
                ...block,
                layout_design,
                content,
            }
        });

        res.status(200).json({result: result});
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// 에디터 블록 백업 가져오기
exports.getBlocksBackup = async (req, res) => {
    const { idx, save_time } = req.params;

    try {
        const getBlocksBackupSaveTime = await editorDB.getBlocksBackupSaveTime(idx);
        const getBlocks = await editorDB.getBlocksBackup(idx, save_time);
        const result = getBlocks.map((block) => {
            const content = block.content
                ? JSON.parse(Buffer.from(Buffer.from(block.content).toString('utf-8'), 'base64').toString('utf-8'))
                : null;

            const layout_design = block.layout_design
                ? Buffer.from(Buffer.from(block.layout_design).toString('utf-8'), 'base64').toString('utf-8')
                : null;

            return {
                ...block,
                layout_design,
                content,
            }
        });

        res.status(200).json({result: result, save_time: getBlocksBackupSaveTime});
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

// 에디터 블록 추가
exports.insertBlock = async (req, res) => {
    const data = req.body;

    try {
        const result = await editorDB.insertBlock(data.page_id, data.block_id, data.block_style, data.design_type, data.design_id, data.layout_design, data.block_order);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json('추가 오류');
    }
};

// 에디터 블록 순서 변경
exports.orderBlock = async (req, res) => {
    const data = req.body;

    try {
        const result = await editorDB.orderBlock(data.block_id, data.block_order);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json('순서 변경 오류');
    }
};

// 에디터 블록 디자인 변경
exports.updateBlockDesign = async (req, res) => {
    const data = req.body;

    try {
        const result = await editorDB.updateBlockDesign(data.block_id, data.design_type, data.design_id, data.content);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json('디자인 선택 오류');
    }
}

// 에디터 블록 삭제
exports.deleteBlock = async (req, res) => {
    const { block_id } = req.params;

    console.log(block_id);

    try {
        const result = await editorDB.deleteBlock(block_id);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json('삭제 오류');
    }
}

// 에디터 블록 레이아웃 변경
exports.updateBlockLayout = async (req, res) => {
    const data = req.body;

    try {
        const result = await editorDB.updateBlockLayout(data.block_id, data.layout_design);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json('디자인 선택 오류');
    }
}


// 에디터 블록 저장
exports.saveBlock = async (req, res) => {
    const data = req.body;
    const { page_idx, blocks, save_time } = data;

    // 에디터 블록 저장 시, 에디터 블록에 포함되지 않은 이미지 파일 전부 삭제
    // const imagesDirPath = path.join('static/images', String(page_idx));
    // fs.readdir(imagesDirPath, (err, files) => {
    //     if (err) {
    //         console.error(err);
    //         return;
    //     }
    //     files.forEach((file) => {
    //         const filePath = path.join(imagesDirPath, file);
    //         const fileUrl = `http://${req.headers.host}/${filePath.replace(/\\/g, '/')}`;
    //         if (!srcList.includes(fileUrl)) {
    //             fs.unlink(filePath, (err) => {
    //                 if (err) {
    //                     console.error(err);
    //                     return;
    //                 }
    //             });
    //         }
    //     });
    // });
    
    try {
        const result = await editorDB.saveBlock(page_idx, blocks, save_time);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json('저장 오류');
    }
}

exports.copyDesign = async (req, res) => {
    const data = req.body;
    const { sourcePage, targetPage } = data;

    try {
        const getBlocks = await editorDB.getBlocks(targetPage);
        const copyBlocks = getBlocks.map((block) => {
            // 블록 레이아웃 디자인 이미지 경로 변경
            if (block.layout_design !== null) {
                let layout_design = JSON.parse(Buffer.from(Buffer.from(block.layout_design).toString('utf-8'), 'base64').toString('utf-8'));
                layout_design = layout_design.map((layout) => {
                    if (layout.design_type === 'image') {
                        layout.boxes.images = layout.boxes.images.map((image) => {
                            if (image.src === '') return image;
                            image.src = image.src.replace(`images/${targetPage}`, `images/${sourcePage}`);
                            return image;
                        });
                    } else if (layout.design_type === 'list') {
                        if (layout.boxes.images[0] !== '') {
                            layout.boxes.images[0].src = layout.boxes.images[0].src.replace(`images/${targetPage}`, `images/${sourcePage}`);
                        }
                    }
                    return layout;
                });
                block.layout_design = btoa(unescape(encodeURIComponent(JSON.stringify(layout_design))));
            } 
            // 블록 디자인 이미지 경로 변경
            if (block.content !== null) {
                let content = JSON.parse(Buffer.from(Buffer.from(block.content).toString('utf-8'), 'base64').toString('utf-8'));
                if (block.design_type === 'image') {
                    content.images = content.images.map((image) => {
                        if (image.src === '') return image;
                        image.src = image.src.replace(`images/${targetPage}`, `images/${sourcePage}`);
                        return image;
                    });
                } else if (block.design_type === 'list') {
                    if (content.images[0].src !== '') {
                        content.images[0].src = content.images[0].src.replace(`images/${targetPage}`, `images/${sourcePage}`);
                    }
                }
                block.content = btoa(unescape(encodeURIComponent(JSON.stringify(content))));
            }

            // block_id 변경
            const split_value = block.block_id.split('_');
            split_value[0] = sourcePage;
            block.block_id = split_value.join('_');

            // block_style block_id 변경
            if (block.block_style !== null) {
                let block_style = JSON.parse(block.block_style);

                const style_split_value = block_style.block_id.split('_');
                style_split_value[0] = sourcePage;
                block_style.block_id = style_split_value.join('_');

                block.block_style = JSON.stringify(block_style);
            }

            return block;
        });
        await editorDB.deleteAllBlocks(sourcePage);
        const result = await editorDB.copyDesign(sourcePage, copyBlocks);
        copyFiles(`static/images/${sourcePage}`, `static/images/${targetPage}`);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json('복사 오류');
    }
}

// 이미지 폴더 복사
function copyFiles(sourceDir, targetDir) {
    // 소스 디렉토리가 존재한다면
    if (fs.existsSync(targetDir)){
        // 대상 디렉토리가 존재하지 않으면 생성합니다.
        if (!fs.existsSync(sourceDir)){
        fs.mkdirSync(sourceDir, { recursive: true });
        }
    
        // 모든 파일을 읽어옵니다.
        const files = fs.readdirSync(targetDir);
    
        // 각 파일을 복사합니다.
        for (const file of files) {
            const srcFile = path.join(targetDir, file);
            const destFile = path.join(sourceDir, file);
            
            // 파일을 복사합니다.
            fs.copyFileSync(srcFile, destFile);
            console.log(`Copied file ${file} to ${sourceDir}`);
        }
    }
}

exports.changeMenuSaveTimeAPI = async (req, res) => {
    const data = req.body;

    try {
        // 히스토리 값 가져오기
        const getHistoryData = await editorDB.getBlocksBackup(data.page_idx, data.save_time);

        // menus 테이블 save_time 값 변경
        await editorDB.changeMenuSaveTimeAPI(data.page_idx, data.save_time);

        // 기존 blocks 테이블 값 지우고 히스토리 값으로 블록 업데이트
        await editorDB.updateBlock(data.page_idx, getHistoryData);

        const result = getHistoryData.map((block) => {
            const content = block.content
            ? JSON.parse(Buffer.from(Buffer.from(block.content).toString('utf-8'), 'base64').toString('utf-8'))
            : null;

            const layout_design = block.layout_design
            ? Buffer.from(Buffer.from(block.layout_design).toString('utf-8'), 'base64').toString('utf-8')
            : null;

            return {
                ...block,
                layout_design,
                content,
            }
        });

        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json('디자인 선택 오류');
    }
}