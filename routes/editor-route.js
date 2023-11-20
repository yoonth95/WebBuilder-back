const express = require("express");
const router = express.Router();
const editorController = require("../controllers/editor-controller");

router.get("/getBlocks/:idx", editorController.getBlocks);
router.get("/getBlocksBackup/:idx/:save_time", editorController.getBlocksBackup);
router.post("/insertBlock", editorController.insertBlock);
router.post("/copyDesign", editorController.copyDesign);
router.post("/changeMenuSaveTimeAPI", editorController.changeMenuSaveTimeAPI);
router.delete("/deleteBlock/:block_id", editorController.deleteBlock);
router.put("/orderBlock", editorController.orderBlock);
router.put("/updateBlockDesign", editorController.updateBlockDesign);
router.put("/updateBlockLayout", editorController.updateBlockLayout);
router.put("/saveBlock", editorController.saveBlock);

module.exports = router;
