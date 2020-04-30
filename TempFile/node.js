/**
 * realize function: 商城专区业务逻辑处理(service)层
 */
const {getvalue} = require('../base');
const {getcode} = require("../base").code;
const {numMulti, numSub} = require('../base').tool;
const ProductDao = require('../sql/productdao');
const EquityTimertask = require('../sql/equitytimertask');
const config = require('../../config/config');
 /**
     * @realize function:  查询指定专区的商品 get special area goods list
     * @param {*} arronditype:  专区类别id
     * @param {*} page:  
     * @param {*} pagesize:  
     */
const getspecialareagoodslist = async (message, req) => {
    let arronditype = getvalue(message, 'arronditype', null);
    let page = getvalue(message, 'page', 1);
    let pagesize = getvalue(message, 'pagesize', 10);
    let userid = getvalue(message, 'userid', 10);
    let code = getcode(1);
    let where = ` and a.arronditype = '${arronditype}' `;
    // 如果传入的专区类别为null，则返回空数组
    if (arronditype == null || arronditype.trim().length == 0) {
        code.result = JSON.stringify({goods: []});
        return code;
    }
    let goods = await ProductDao.getspecialareagoodslist(where, page, pagesize);
    let userInfo = await EquityTimertask.getuserinfo(userid);
    let levInfo = null;
    if (userInfo.isvip == 1) {
        levInfo = await EquityTimertask.getuserviplevel(userid); // 查询用户的权益等级
    }
    for(let i = 0; i < goods.length; i++) { 
        let icon = await ProductDao.getproductimage(goods[i].id);
        goods[i].imgurl = icon.length > 0 ? config.imageurl(icon[0].id, 2, '')  : ""; // 商品图片
        goods[i].countstock = goods[i].stock + goods[i].saletotal; // 活动商品总数量
        if (goods[i].pstock < goods[i].stock) { // 活动商品数大于总库存数
            goods[i].stock = goods[i].pstock;
        }
        if (userInfo.isvip != 1) {
            goods[i].goodsrate = 0; // 用户不是会员，没有抵扣金额
            goods[i].ratenum = 0;
        } else {
            let valueInfo = await calculateGoodsRate(goods[i].salprice, 1, levInfo[0].id);
            goods[i].goodsrate = valueInfo.goodsrate;
            goods[i].ratenum = valueInfo.value;
        }
    }
    code.result = JSON.stringify({goods});
    return code;
}

/**
 * @realize function: 计算宝银抵扣率
 * @param {*} goodsmoney: 商品当前价格
 * @param {*} type: 计算类型[1: 权益等级]
 * @param {*} param: type为1时传入的是权益等级id
 */
const calculateGoodsRate = async (goodsmoney, type, param) => {
    if (type == 1) { // 权益等级计算
        let equityInfo = await EquityTimertask.getuserlevelhaveequity(param, 'vip_area');
        if (equityInfo.length == 0) {
            return {goodsrate: 0, value: 0};
        }
        let config = equityInfo[0].config ? JSON.parse(equityInfo[0].config) : [];
        if (config.length == 0) {
            return {goodsrate: 0, value: 0};
        }
        for(let i = 0; i < config.length; i++) {
            if (config[i].id == param && config[i].value) {
                return {goodsrate: numMulti(goodsmoney, parseFloat(config[i].value)), value: parseFloat(config[i].value)};
            }
            if (i == config.length - 1) {
                return {goodsrate: 0, value: 0};
            }
        }
    }
    return {goodsrate: 0, value: 0};
}

module.exports = {
    getspecialareagoodslist,
}