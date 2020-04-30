var express = require("express");
var router = express.Router();
var base = require("../base");
var arrondi_productlogic = require("../../logic/mall/arrondi_productlogic");
const productservice = require("../../logic/mall/productservice");
router.all('/', function (req, res) {
    base.execute(req.body.param, arrondi_productlogic, req)
        .then(function (result) {
            res.send(result);
        })
})
// 查询指定专区的商品
router.all('/getspecialareagoodslist', function (req, res) {
    base.execute(req.body.param, productservice, req)
        .then(function (result) {
            res.send(result);
        })
})

module.exports = router;
