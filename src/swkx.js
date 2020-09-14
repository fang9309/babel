/*全局变量*/
var tariffArr = new Array();
var arr = new Array();
this.origin = this.bpa.origin;
var busiArr = new Array();
//表单加载前执行方法
this.init = async () => {
  if (this.origin == "DRAFT_CENTER" || this.origin == "DRAFT_BOX"
    || (this.origin == "PENDING" && this.bpa.currentStep == "step10")) {//起草与新增
    this.getTraiff(this.formData.tariffCategory, "init");//获取资费信息
  }
}
/**加载完执行方法 */
this.endInit = async () => {
  this.requestdSetVal("bizCode", this.bpa.bizCode);
  //是否是特批控制显示隐藏 || this.formData.specialIs == ""
  if (this.formData.specialIs == "0" || this.formData.specialIs == "否"
  ) {
    this.requestdSetVal("specialIs", "否");
  } else {
    this.requestdSetVal("specialIs", "是");
  }
  //赋值不显示
  this.getNode("bizCode").style.display = "none";
  this.getNode("specialIs").style.display = "none";//是否为特批
  this.getNode("applyPersonCode").style.display = "none";//申请人4A
  this.getNode("applyPersonDeptCode").style.display = "none";//申请人部门
  this.getNode("applyStatus").style.display = "none";//申请状态
  this.getNode("lineNumber").style.display = "none";//审批路径
  //显示隐藏标签
  this.showHideIsSpecial(this.formData.tariffCategory);
  this.showHiideBankInfo();
  this.hideShowSalesCategory();
  this.hideShowTariffCategory(this.formData.tariffCategory);
  this.hideShowContrat(this.formData.signatureType);
  if (this.formData.approvalAttach != "") {
    this.getUpThreeNode("approvalAttach").style.display = "block";
  } else {
    this.getUpThreeNode("approvalAttach").style.display = "none";
  }

  if (this.origin == "DRAFT_CENTER" || this.origin == "DRAFT_BOX"
    || (this.origin == "PENDING" && this.bpa.currentStep == "step10")) {//起草与暂存与查看
    //给readonly赋值样式  lineconstructionCost
    var backArr = ["applyPersonName", "applyPersonDeptName", "applyPersonPhone", "applyCodeNum",
      "amountTotal", "ioCoefficient", "contractPeriodTotal", "clientGrade",
      "custCo", "opportunityName", "custName", "demandType", "lineconstructionCost",
      "settlementCost", "channelCost"]
    for (let h = 0; h < backArr.length; h++) {
      document.querySelector("#" + backArr[h]).style.background = "#F5F7F9";
    }
    this.getUpThreeNode("contractInfo").style.display = "none";
    this.getUpThreeNode("previewAttach").style.display = "none";

    //特批编号获取
    if (this.origin == "DRAFT_CENTER" || this.origin == "DRAFT_BOX") {//起草与新增
      if (this.origin == "DRAFT_CENTER") {//新增查询特批编号
        let result = await this.postData(
          "http://172.30.200.245:8090/GovernmenCustomerApprove/protocol/findProtocolNumCode",
          {
            userCode: this.bpa.userCode
          })
        this.requestdSetVal("applyCodeNum", result.applyCodeNum);
        this.delFormItem("swkx_busi_child");
      }

      this.requestdSetVal("applyPersonPhone",
        typeof (this.bpa.userDetails.mobilePhone) == "undefined" ? "18967896789" : this.bpa.userDetails.mobilePhone);
      //特批有效期赋值默认为申请日期三个月
      var date = new Date();
      var applyDate = date.toISOString().substr(0, 10);
      this.requestdSetVal("acceptDate", applyDate);//申请时间
      date.setMonth(date.getMonth() + 3);
      var dateStr = date.toISOString();
      dateStr = dateStr.substr(0, 10);
      this.requestdSetVal("periodValidity", dateStr);
      //需要赋值显示字段
      this.requestdSetVal("applyPersonCode", this.bpa.userId);
      this.requestdSetVal("applyPersonDeptCode", this.bpa.orgId);
      this.requestdSetVal("applyPersonName", this.bpa.userName);
      this.requestdSetVal("applyPersonDeptName", this.bpa.orgName);
      this.setIsShowBtn("swkx_busi_child", false); //隐藏业务表添加与删除
    }
    if (this.origin == "DRAFT_BOX" || (this.origin == "PENDING" && this.bpa.currentStep == "step10")) {
      this.hideBusiCommon();//隐藏业务表公用信息
    }
    //事件onblur    onclick onchange
    document.querySelector("#paymentType").onblur = async () => {
      this.showHiideBankInfo();
    }
    document.querySelector("#other1").onclick = async () => {
      this.calContractPeriodTotal();//计算合同金额
      this.calculaTotalCost();//计算打分表
    }

    document.querySelector("#other4").onclick = () => {
      this.delFormItem("swkx_busi_child");
    }
    document.querySelector("#other3").onclick = () => {
      var sign = confirm("提示：修改资费信息后请重新添加业务信息！");
      if (sign) {
        this.delFormItem("swkx_busi_child");
        busiArr.length = 0;//清空busiArr数组
        var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
        var index = 0;
        for (let i = 0; i < zfnum; i++) {
          this.$nextTick(() => {
            var accessScale = this.getChildValue("swkx_cost_child", i, "accessScale");
            var broadNumber = this.getChildValue("swkx_cost_child", i, "broadNumber");
            var packagePeriod = this.getChildValue("swkx_cost_child", i, "packagePeriod");
            var disposableCost = this.getChildValue("swkx_cost_child", i, "disposableCost");
            var applyAmount = this.getChildValue("swkx_cost_child", i, "applyAmount");
            var isApplyIp = this.getChildValue("swkx_cost_child", i, "isApplyIp");
            var applyAmountSign = 0;
            for (let j = 0; j < accessScale * 1; j++) {
              this.addChildForm("swkx_busi_child");
              this.$nextTick(() => {
                this.setChildConfigValue("swkx_busi_child", index, "number", (index + 1));
                //ip数量
                var isApplyTemp = (isApplyIp == "否" ? "4个（免费）" : "8个（含4个免费地址）");
                this.setChildConfigValue("swkx_busi_child", index, "busiIpNumber", isApplyTemp);
                //单位名称
                this.setChildConfigValue("swkx_busi_child", index, "busiCustomerName", this.formData.custName);
                //带宽
                this.setChildConfigValue("swkx_busi_child", index, "bandWidth", broadNumber);
                //一次性费用
                this.setChildConfigValue("swkx_busi_child", index, "nonrecurringCharges", disposableCost);
                //一次性费用大写
                var valueDX = this.DX(disposableCost);
                this.setChildConfigValue("swkx_busi_child", index, "nonrecurringChargesUppercase", valueDX);
                //网络使用费
                applyAmount = parseFloat((applyAmount * 1).toFixed(2));
                this.setChildConfigValue("swkx_busi_child", index, "bandWidthCharges", applyAmount);
                //套餐
                this.setChildConfigValue("swkx_busi_child", index, "packageType", "元/"
                  + (packagePeriod != "" ? packagePeriod.substring(1, packagePeriod.length) : ""));
                //给业务表中大写字段赋值
                var valueDX = this.DX(applyAmount);
                this.setChildConfigValue("swkx_busi_child", index, "bandWidthChargesUppercase", valueDX);
                //装机联系人
                this.setChildConfigValue("swkx_busi_child", index, "installConPerson", this.formData.contactPerson);
                //装机电话
                this.setChildConfigValue("swkx_busi_child", index, "installConPhone", this.formData.mobileTelephone);
                if (j != 0) {//公用信息
                  this.isItemTag("swkx_busi_child", index, "applyContent", false);
                  this.isItemTag("swkx_busi_child", index, "bandWidth", false);
                  this.isItemTag("swkx_busi_child", index, "packageType", false);
                  this.isItemTag("swkx_busi_child", index, "ipOverlayPackage", false);
                  this.isItemTag("swkx_busi_child", index, "marketingCampaign", false);
                  this.isItemTag("swkx_busi_child", index, "nonrecurringCharges", false);
                  this.isItemTag("swkx_busi_child", index, "bandWidthCharges", false);
                  this.isItemTag("swkx_busi_child", index, "bandWidthChargesUppercase", false);
                  this.isItemTag("swkx_busi_child", index, "tenancyTerm", false);
                  this.isItemTag("swkx_busi_child", index, "startTime", false);
                  this.isItemTag("swkx_busi_child", index, "endTime", false);
                  this.isItemTag("swkx_busi_child", index, "busiIpNumber", false);
                  this.isItemTag("swkx_busi_child", index, "busiCustomerName", false);
                  this.isItemTag("swkx_busi_child", index, "nonrecurringChargesUppercase", false);
                  this.isItemTag("swkx_busi_child", index, "installConPerson", false);
                  this.isItemTag("swkx_busi_child", index, "installConPhone", false);
                } else {
                  var obj = { "value": "", "index": index };
                  this.busiTimeHide(obj);//隐藏显示工单中时间
                  busiArr.push(index);//业务信息数组赋值
                }
                index++;
              })
            }
          })
        }
      }
    }
  } else {
    var hideUploadArr = ["attachIds", "competAttach",
      "protocolTempAttach", "registerTempAttach", "tariffAttach",
      "approvalAttach", "previewAttach"];
    var speNum = this.getCodeChildFormData("swkx_cost_child").length;
    for (let i = 0; i < speNum; i++) {
      hideUploadArr.push("child-specialAttach" + i);
    }
    this.hideUploadPending(hideUploadArr);
    this.setIsShowBtn("swkx_busi_child", false);
    this.setIsShowBtn("swkx_cost_child", false);
    this.getUpThreeNode("other1").style.display = "none";
    this.getUpThreeNode("other3").style.display = "none";
    this.getUpThreeNode("other4").style.display = "none";
    this.getUpThreeNode("mainReferance1").style.display = "none";
    //this.setIsShow("swkx_busi_child",false);  //子表单收起与展开
    //this.setIsShow("swkx_cost_child",false);
    if (this.origin != "OTHER") {
      var hideArr = ["officeAddress", "legalPerson", "acceptDate", "legalPerson",
        "numberEmployees", "numberMobile", "fax", "contactPerson", "fixedTelephone",
        "mobileTelephone", "email", "customerCashFinancialContact",
        "customerCashContactPhone", "customerCashContactAddress", "customerCashPostalCode",
        "customerDepositBank", "customerBankAccountNumber", "customerAccountName",
        "customerBankNumber", "techContactPerson", "techTelephone", "techMobileTelephone",
        "techEmail", "techFax", "flatType", "industryInvolved", "mobileDepositBank", "mobileAccountName", "mobileBankNumber",
        "mobileBankAccountNumber", "paymentType", "openDay", "nonrecurringDay",
        "agreementDate", "standOver", "mainApplyContent"
      ];
      this.hideArrPending(hideArr);
      this.isShowChildForm("swkx_busi_child", false);//隐藏业务表
      this.getUpThreeNode("businessInfo").style.display = "none";
      this.getUpThreeNode("paymentInfo").style.display = "none";
      this.getUpThreeNode("prepaidCustomer").style.display = "none";
      this.getUpThreeNode("protocolInfo").style.display = "none";
      var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
      for (let j = 0; j < zfnum; j++) {
        var isApplyIp = this.getChildValue("swkx_cost_child", j, "isApplyIp")
        var obj = { "value": isApplyIp, "index": j };
        this.applyIpHide(obj);
        if (isApplyIp == "是") {
          var ipIsFree = this.getChildValue("swkx_cost_child", j, "ipIsFree")
          var objFree = { "value": ipIsFree, "index": j };
          this.ipIsFreeChange(objFree);
        }
      }
    } else {
      this.getUpThreeNode("offline").style.display = "none";
      this.getUpThreeNode("unilateral").style.display = "none";
      this.getUpThreeNode("bilateral").style.display = "none";
      var hideUploadArr = ["attachIds", "competAttach",
        "protocolTempAttach", "registerTempAttach", "tariffAttach",
        "approvalAttach", "previewAttach", "protocolAttach", "registerAttach"];
      this.hideUploadPending(hideUploadArr);
      var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
      for (let j = 0; j < zfnum; j++) {//资费信息
        var isApplyIp = this.getChildValue("swkx_cost_child", j, "isApplyIp")
        var obj = { "value": isApplyIp, "index": j };
        this.applyIpHide(obj);
        if (isApplyIp == "是") {
          var ipIsFree = this.getChildValue("swkx_cost_child", j, "ipIsFree")
          var objFree = { "value": ipIsFree, "index": j };
          this.ipIsFreeChange(objFree);
        }
      }
      this.hideBusiCommon();//*查看时隐藏业务信息
    }
  }
}
/**查看时隐藏业务信息 */
this.hideBusiCommon = () => {
  var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
  var index = 0;
  var accessScaleTotal = 0;
  debugger;
  var ywnum = this.getCodeChildFormData("swkx_busi_child").length;
  for (let i = 0; i < zfnum; i++) {
    var accessScale = this.getChildValue("swkx_cost_child", i, "accessScale");
    accessScaleTotal = accessScaleTotal + accessScale * 1;
  }
  if (ywnum == accessScaleTotal) {
    for (let i = 0; i < zfnum; i++) {
      var accessScale = this.getChildValue("swkx_cost_child", i, "accessScale");
      for (let j = 0; j < accessScale * 1; j++) {
        if (j != 0) {//公用信息
          this.isItemTag("swkx_busi_child", index, "applyContent", false);
          this.isItemTag("swkx_busi_child", index, "bandWidth", false);
          this.isItemTag("swkx_busi_child", index, "packageType", false);
          this.isItemTag("swkx_busi_child", index, "ipOverlayPackage", false);
          this.isItemTag("swkx_busi_child", index, "marketingCampaign", false);
          this.isItemTag("swkx_busi_child", index, "nonrecurringCharges", false);
          this.isItemTag("swkx_busi_child", index, "bandWidthCharges", false);
          this.isItemTag("swkx_busi_child", index, "bandWidthChargesUppercase", false);
          this.isItemTag("swkx_busi_child", index, "tenancyTerm", false);
          this.isItemTag("swkx_busi_child", index, "startTime", false);
          this.isItemTag("swkx_busi_child", index, "endTime", false);
          this.isItemTag("swkx_busi_child", index, "busiIpNumber", false);
          this.isItemTag("swkx_busi_child", index, "busiCustomerName", false);
          this.isItemTag("swkx_busi_child", index, "nonrecurringChargesUppercase", false);
          this.isItemTag("swkx_busi_child", index, "installConPerson", false);
          this.isItemTag("swkx_busi_child", index, "installConPhone", false);
        } else {
          var tenancyTerm = this.getChildValue("swkx_busi_child", index, "tenancyTerm");
          var obj = { "value": tenancyTerm, "index": index };
          this.busiTimeHide(obj);//隐藏显示工单中时间
          busiArr.push(index);//业务信息数组赋值草稿与退回时要加
        }
        index++;
      }
    }
  }else{
    this.delFormItem("swkx_busi_child");
  }
}

//提交前回调
this.submitFormBack = (value) => {
  var flag = true;
  var message = "";
  var lineNumber = 1;
  var specialIs = value.specialIs;//是否为特批
  var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
  var ywnum = this.getCodeChildFormData("swkx_busi_child").length;//业务表个数
  if (this.origin == "DRAFT_CENTER" || this.origin == "DRAFT_BOX"
    || (this.origin == "PENDING" && this.bpa.currentStep == "step10")) {
    if (this.origin == "DRAFT_BOX") {//草稿进入修改下工单状态
      this.requestdSetVal("applyStatus", "2");
    }
    if (specialIs == "是") {//特殊资费进行处理
      var tariffCategory = value.tariffCategory;//资费类别
      var totalAccessScale = 0;//接入规模
      var disposableCostTotal = 0;//一次性总费用
      var applyAmountTotal = 0;//申请金额
      var ipNumberTotal = 0;//资费表中IP总个数
      for (let k = 0; k < zfnum; k++) {
        var accessScale = this.getChildValue("swkx_cost_child", k, "accessScale");
        var ipNumber = this.getChildValue("swkx_cost_child", k, "ipNumber");
        ipNumberTotal = ipNumberTotal + ipNumber * 1 * accessScale * 1;
        var disposableCost = this.getChildValue("swkx_cost_child", k, "disposableCost");
        disposableCostTotal = disposableCostTotal + disposableCost * 1 * accessScale * 1;
        var applyAmount = this.getChildValue("swkx_cost_child", k, "applyAmount");
        applyAmountTotal = applyAmountTotal + applyAmount * 1 * accessScale * 1;
        totalAccessScale = totalAccessScale + accessScale * 1;
      }
      if (tariffCategory == "竞争资费" && totalAccessScale < 2) {
        message = "竞争资费场景接入点规模必须大于等于2条，请确认！";
        flag = false;
        return { value, isSubmit: flag, message: message };
      }
      if (ywnum != totalAccessScale) {
        message = "资费中接入点总数量与业务信息中条数不一致，请确认！";
        flag = false;
        return { value, isSubmit: flag, message: message };
      }
      var busiIpNumTotal = 0;//业务表中IP总个数
      var busiNonrTotal = 0;//业务表中一次性总金额
      var busiBandTotal = 0;//业务表中网络使用费
      var dateSign = 0;
      for (let i = 0; i < ywnum; i++) {
        var busiIpNumber = this.getChildValue("swkx_busi_child", i, "busiIpNumber");
        busiIpNumber = busiIpNumber.startsWith("4个") ? 4 : 8;
        busiIpNumTotal = busiIpNumTotal + busiIpNumber * 1;
        var nonrecurringCharges = this.getChildValue("swkx_busi_child", i, "nonrecurringCharges");
        busiNonrTotal = busiNonrTotal + nonrecurringCharges * 1;
        var bandWidthCharges = this.getChildValue("swkx_busi_child", i, "bandWidthCharges");
        busiBandTotal = busiBandTotal + bandWidthCharges * 1;
        var tenancyTerm = this.getChildValue("swkx_busi_child", i, "tenancyTerm");
        if (tenancyTerm.startsWith("临时")) {
          var startTime = this.getChildValue("swkx_busi_child", i, "startTime");
          var endTime = this.getChildValue("swkx_busi_child", i, "endTime");
          if (startTime != "" && endTime != "") {
            var start = new Date(startTime.replace(/-/g, "/")).getTime();
            var end = new Date(endTime.replace(/-/g, "/")).getTime();
            if (end < start) {
              dateSign = i + 1;
              break;
            } else {
              if (end - start > 31 * 24 * 60 * 60 * 1000) {
                dateSign = i + 1;
                break;
              }
            }
          }
        }
      }
      if (dateSign != 0) {
        message = "请核实第" + dateSign + "条业务信息，租期为临时，结束时间不能小于开始时间,并且开始于结束日期不能大于一个月！";
        flag = false;
        return { value, isSubmit: flag, message: message };
      }
      if (ipNumberTotal != busiIpNumTotal) {
        message = "资费中IP总数量（接入点个数乘以IP数量）与业务信息中IP地址数量（多条相加）不一致，请确认！";
        flag = false;
        return { value, isSubmit: flag, message: message };
      }
      if (disposableCostTotal != busiNonrTotal) {
        message = "资费中接入点数×一次性费用与业务信息中一次性费用的总金额不一致，请确认！";
        flag = false;
        return { value, isSubmit: flag, message: message };
      }
      if (applyAmountTotal != busiBandTotal) {
        message = "资费中接入点数×申请金额与业务信息中网络使用费的总金额不一致，请确认！";
        flag = false;
        return { value, isSubmit: flag, message: message };
      }
      var ioCoefficient = this.formData.ioCoefficient;
      if (ioCoefficient >= 1) {
        if (tariffCategory == "普通折扣") {
          var lowDiscount = 100;
          for (let i = 0; i < zfnum; i++) {
            //减免一次性费用、收费IP费用减免路径三
            var disposableCost = this.getChildValue("swkx_cost_child", i, "disposableCost");
            var ipIsFree = this.getChildValue("swkx_cost_child", i, "ipIsFree");
            if (disposableCost * 1 == 0 || ipIsFree == "是") {
              lineNumber = lineNumber > 3 ? lineNumber : 3;
              break;
            }
            var broadNumber = this.getChildValue("swkx_cost_child", i, "broadNumber");
            var applyAmount = this.getChildValue("swkx_cost_child", i, "applyAmount") * 1;
            if (broadNumber == "20M") {
              console.log(lineNumber > 2 ? lineNumber : 2);
              if (applyAmount >= 400) {
                lineNumber = lineNumber > 1 ? lineNumber : 1;
              } else if (applyAmount >= 120) {
                lineNumber = lineNumber > 2 ? lineNumber : 2;
              } else {
                lineNumber = lineNumber > 3 ? lineNumber : 3;
                break;
              }
            } else if (broadNumber == "50M") {
              if (applyAmount >= 1100) {
                lineNumber = lineNumber > 1 ? lineNumber : 1;
              } else if (applyAmount >= 280) {
                lineNumber = lineNumber > 2 ? lineNumber : 2;
              } else {
                lineNumber = lineNumber > 3 ? lineNumber : 3;
                break;
              }
            } else if (broadNumber == "100M") {
              if (applyAmount >= 2000) {
                lineNumber = lineNumber > 1 ? lineNumber : 1;
              } else if (applyAmount >= 550) {
                lineNumber = lineNumber > 2 ? lineNumber : 2;
              } else {
                lineNumber = lineNumber > 3 ? lineNumber : 3;
                break;
              }
            } else if (broadNumber == "200M") {
              if (applyAmount >= 3800) {
                lineNumber = lineNumber > 1 ? lineNumber : 1;
              } else if (applyAmount >= 1100) {
                lineNumber = lineNumber > 2 ? lineNumber : 2;
              } else {
                lineNumber = lineNumber > 3 ? lineNumber : 3;
                break;
              }
            } else if (broadNumber == "500M") {
              if (applyAmount >= 9200) {
                lineNumber = lineNumber > 1 ? lineNumber : 1;
              } else if (applyAmount >= 2600) {
                lineNumber = lineNumber > 2 ? lineNumber : 2;
              } else {
                lineNumber = lineNumber > 3 ? lineNumber : 3;
                break;
              }
            }
          }
        } else if (tariffCategory == "竞争资费") {
          lineNumber = 4;
        }
      } else {
        lineNumber = 4;
      }
    } else {//非特批
      lineNumber = 1;
    }
    if (lineNumber >= 2 && this.formData.approvalLevels.length < 2) {
      message = "请勾选项目商机真实性及竞争信息已经过二级经理走访核实！";
      flag = false;
      return { value, isSubmit: flag, message: message };
    }
    if (lineNumber == 3) {
      this.getUpThreeNode("approvalAttach").style.display = "block";
      if (this.formData.approvalAttach == "") {
        message = "此工单需要政企审批，请上传审批依据！";
        flag = false;
      } else {
        flag = true;
      }
      console.log("路径为---" + lineNumber)
      value.lineNumber = lineNumber;
    } else {
      this.getUpThreeNode("approvalAttach").style.display = "none";
      value.lineNumber = lineNumber;
    }
  }
  return { value, isSubmit: flag, message: message };
}

/**获取套餐并给子表单赋值 */
this.getTraiff = async (tariffCategory, types) => {
  var specialIs = this.formData.specialIs;  //是否为特批
  let result = await this.postData(
    "http://172.30.200.245:8090/GovernmenCustomerApprove/protocol/findTariffs",
    {
      crmDevise: '112677000001',
      isSpecial: specialIs,
      tariffsType: ""
    }
  )
  tariffArr = result.broadList;
  if (result.broadList.length > 0) {
    arr.length = 0;//清空数组
    for (let i = 0; i < result.broadList.length; i++) {
      var obj = {
        "label": result.broadList[i].broadNumber,
        "value": result.broadList[i].broadNumber
      };
      arr.push(obj);
    }
    var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
    for (let j = 0; j < zfnum; j++) {
      if (types != "init") {
        this.setChildConfigValue("swkx_cost_child", j, "broadNumber", " ");
        this.setChildConfigValue("swkx_cost_child", j, "packagePeriod", " ");
        this.setChildConfigValue("swkx_cost_child", j, "standardPrice", "");
      }
      this.setChildOptionValue("swkx_cost_child", j, "broadNumber", arr);//下拉框输入框
      var isApplyIp = this.getChildValue("swkx_cost_child", j, "isApplyIp")
      var obj = { "value": isApplyIp, "index": j };
      this.applyIpHide(obj);
    }
  }
}

this.custNameBlur = (value) => {
  var ywnum = this.getCodeChildFormData("swkx_busi_child").length;
  for (let i = 0; i < ywnum; i++) {
    this.setChildConfigValue("swkx_busi_child", i, "busiCustomerName", value.value);
  }
}

this.contactPersonBlur = (value) => {
  this.busiPersonAndMobile({ "code": "installConPerson", "value": value.value });
}

this.mobileTelephoneBlur = (value) => {
  this.busiPersonAndMobile({ "code": "installConPhone", "value": value.value });
}

this.busiPersonAndMobile = (obj) => {
  var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
  var index = 0;
  for (let i = 0; i < zfnum; i++) {
    var accessScale = this.getChildValue("swkx_cost_child", i, "accessScale") * 1;
    for (let j = 0; j < accessScale; j++) {
      this.isItemTag("swkx_busi_child", index, obj.code, true);
      this.setChildConfigValue("swkx_busi_child", index, obj.code, obj.value);
      if (j != 0) {
        this.isItemTag("swkx_busi_child", index, obj.code, false);
      }
      index++;
    }
  }
}

//监听点击添加事件
this.listenAddClick = (value) => {
  var index = value.index;
  if (value.code == "swkx_cost_child") {
    this.setChildConfigValue("swkx_cost_child", value.index, "serialNumber", (value.index + 1));
    this.setChildOptionValue("swkx_cost_child", value.index, "broadNumber", arr);
    var isApplyIp = this.getChildValue("swkx_cost_child", value.index, "isApplyIp")
    var obj = { "value": isApplyIp, "index": value.index };
    this.applyIpHide(obj);
  }
}


/**切换业务租期 */
this.tenancyTermChange = (value) => {
  this.busiTimeHide(value);
  this.setBusiArrValue({ "code": "tenancyTerm", "value": value.value, "index": value.index });
}

/**开始时间 */
this.startTimeChange = (value) => {
  this.setBusiArrValue({ "code": "startTime", "value": value.value, "index": value.index });
}
/**结束时间 */
this.endTimeChange = (value) => {
  this.setBusiArrValue({ "code": "endTime", "value": value.value, "index": value.index });
}
/**业务信息赋值 */
this.setBusiArrValue = (obj) => {
  if (obj.index >= busiArr[busiArr.length - 1]) {//最后一个业务信息表单
    var ywnum = this.getCodeChildFormData("swkx_busi_child").length;
    for (let h = obj.index; h < ywnum; h++) {
      this.isItemTag("swkx_busi_child", h, obj.code, true);
      this.setChildConfigValue("swkx_busi_child", h, obj.code, obj.value);
      if (h != busiArr[busiArr.length - 1]) {
        this.isItemTag("swkx_busi_child", h, obj.code, false);
      }
    }
  } else {
    for (let i = 0; i < busiArr.length - 1; i++) {
      if (busiArr[i] <= obj.index && obj.index < busiArr[i + 1]) {
        for (let j = busiArr[i]; j < busiArr[i + 1]; j++) {
          this.isItemTag("swkx_busi_child", j, obj.code, true);
          this.setChildConfigValue("swkx_busi_child", j, obj.code, obj.value);
          if (j != busiArr[i]) {
            this.isItemTag("swkx_busi_child", j, obj.code, false);
          }
        }
      }
    }
  }
}

/**业务表中显示隐藏 */
this.busiTimeHide = (value) => {
  if (value.value.startsWith("临时")) {
    this.isItemTag("swkx_busi_child", value.index, "startTime", true);
    this.$nextTick(()=>{
      this.isItemTag("swkx_busi_child", value.index, "endTime", true);
    })
  } else {
    this.isItemTag("swkx_busi_child", value.index, "startTime", false);
    this.isItemTag("swkx_busi_child", value.index, "endTime", false);
  }
}

/**资费表切换是否申请额外Ip */
this.isApplyIpChange = (value) => {
  this.applyIpHide(value);
  this.calContractPeriodTotal();//计算合同总金额
}
/**隐藏Ip信息 */
this.applyIpHide = (value) => {
  if (value.value == "是") {
    this.isItemTag("swkx_cost_child", value.index, "ipIsFree", true);
    this.isItemTag("swkx_cost_child", value.index, "ipPrice", true);
    this.setChildConfigValue("swkx_cost_child", value.index, "ipNumber", "8");
    //是否申请IP费用
    var obj = { "value": "否", "index": value.index };
    this.setChildConfigValue("swkx_cost_child", value.index, "ipIsFree", "否");
    this.ipIsFreeChange(obj);
  } else {
    this.setChildConfigValue("swkx_cost_child", value.index, "ipNumber", "4");
    this.isItemTag("swkx_cost_child", value.index, "ipPrice", true);//先展示赋值后隐藏
    this.setChildConfigValue("swkx_cost_child", value.index, "ipPrice", "");
    this.isItemTag("swkx_cost_child", value.index, "ipIsFree", false);
    this.isItemTag("swkx_cost_child", value.index, "ipPrice", false);
    this.isItemTag("swkx_cost_child", value.index, "specialAttach", false);
  }
}

/**是否减免额外IP费用 */
this.ipIsFreeChange = (value) => {
  var specialIs = this.formData.specialIs;
  if (specialIs == "是" && value.value == "是") {
    this.setChildConfigValue("swkx_cost_child", value.index, "ipPrice", "0");
    this.isItemTag("swkx_cost_child", value.index, "specialAttach", true);
  } else if (specialIs == "否" && value.value == "是") {
    alert("非特批中是否减免额外IP不能为是！");
    this.$nextTick(() => {
      this.setChildConfigValue("swkx_cost_child", value.index, "ipIsFree", "否");
    })
  } else {
    var packagePeriod = this.getChildValue("swkx_cost_child", value.index, "packagePeriod");
    var ipPrice = 0;
    if (packagePeriod == "包月") {
      ipPrice = 400;
    } else if (packagePeriod == "包季度") {
      ipPrice = 400 * 3;
    } else if (packagePeriod == "包半年") {
      ipPrice = 400 * 6;
    } else if (packagePeriod == "包年") {
      ipPrice = 400 * 12;
    }
    this.setChildConfigValue("swkx_cost_child", value.index, "ipPrice", ipPrice);
    this.isItemTag("swkx_cost_child", value.index, "specialAttach", false);
  }
}
/**一次性费用 */
this.disposableCostChange = (value) => {
  var specialIs = this.formData.specialIs;
  if (specialIs == "否" && value.value == "0") {
    alert("非特批中一次性费用不能为0元！");
    this.$nextTick(() => {
      this.setChildConfigValue("swkx_cost_child", value.index, "disposableCost", "100");
    })
  }
}
/**监听主表资费类别变化 */
this.tariffCategoryChange = async (value) => {
  this.hideShowTariffCategory(value.value);//资费类别控制显示隐藏
  this.getTraiff(value.value, "change");//获取资费信息
  this.showHideMarkingTable(value.value);
}
/**监听申请资费中子表单变化 */
this.broadNumberChange = (value) => {
  //给标签赋值
  this.setChildConfigValue("swkx_cost_child", value.index, "broadNumber", value.value);
  var packagePeriodArr = new Array();
  for (var i = 0; i < tariffArr.length; i++) {
    if (value.value == tariffArr[i].broadNumber) {
      for (var j = (tariffArr[i].property.length - 1); j >= 0; j--) {
        var obj = {
          "label": tariffArr[i].property[j].PACKAGE_PERIOD,
          "value": tariffArr[i].property[j].PACKAGE_PERIOD
        }
        packagePeriodArr.push(obj)
      }
    }
  }
  //设置默认值套餐类型与标准价格
  this.setChildOptionValue("swkx_cost_child", value.index, "packagePeriod", packagePeriodArr);
  this.setChildConfigValue("swkx_cost_child", value.index, "packagePeriod", "包月");
  var obj = { "value": "包月", "index": value.index };
  this.packagePeriodChange(obj);
}

/**监听子表单套餐变化 */
this.packagePeriodChange = (value) => {
  var boadInfo = this.getChildValue("swkx_cost_child", value.index, "broadNumber");
  for (var i = 0; i < tariffArr.length; i++) {
    if (boadInfo == tariffArr[i].broadNumber) {
      for (var j = 0; j < tariffArr[i].property.length; j++) {
        if (value.value == tariffArr[i].property[j].PACKAGE_PERIOD) {
          console.log(tariffArr[i].property[j].PRICE);
          this.setChildConfigValue("swkx_cost_child", value.index, "standardPrice", tariffArr[i].property[j].PRICE);
        }
      }
    }
  }
  this.calDiscount(value.index);
}

/**监听申请金额变化 */
this.applyAmountBlur = (value) => {
  var specialIs = this.formData.specialIs;
  if (specialIs == "否") {
    var standardPrice = this.getChildValue("swkx_cost_child", value.index, "standardPrice") == "" ? 0 : this.getChildValue("swkx_cost_child", value.index, "standardPrice");
    if (value.value < standardPrice) {
      alert("非特批中申请金额不能小于标准金额！");
      this.$nextTick(() => {
        this.setChildConfigValue("swkx_cost_child", value.index, "applyAmount", standardPrice);
        this.calDiscount(value.index);
      })
    }
  }
  this.calDiscount(value.index);
  this.calContractPeriodTotal();//计算合同总金额
}
/**监听接入点规模变化 */
this.accessScaleBlur = (value) => {
  this.calContractPeriodTotal();//计算合同总金额
}

/**计算资费子表中的折扣 */
this.calDiscount = (num) => {
  var applyAmount = this.getChildValue("swkx_cost_child", num, "applyAmount") == "" ? 0 : this.getChildValue("swkx_cost_child", num, "applyAmount");
  var standardPrice = this.getChildValue("swkx_cost_child", num, "standardPrice") == "" ? 0 : this.getChildValue("swkx_cost_child", num, "standardPrice");
  var discount = this.getChildValue("swkx_cost_child", num, "discount");
  if (standardPrice == "" || standardPrice == "0") {
    discount = 0;
  } else {
    discount = applyAmount * 1 / standardPrice * 1 * 100
  }
  discount = discount.toFixed(2);
  this.setChildConfigValue("swkx_cost_child", num, "discount", discount);
}
/**修改合同期失去焦点 */
this.contractPeriodBlur = (value) => {
  var contractPeriod = value.value;
  contractPeriod = contractPeriod.replace(/[^\d.]/g, '');//替换下子表单的值
  this.requestdSetVal("contractPeriod", contractPeriod);
  this.calContractPeriodTotal();
}
/**计算合同金额 */
this.calContractPeriodTotal = () => {
  var contractPeriod = this.formData.contractPeriod == "" ? 0 : this.formData.contractPeriod;//合同期
  var total = 0;
  var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
  for (let i = 0; i < zfnum; i++) {
    var applyAmount = this.getChildValue("swkx_cost_child", i, "applyAmount") == "" ? 0 : this.getChildValue("swkx_cost_child", i, "applyAmount");
    var accessScale = this.getChildValue("swkx_cost_child", i, "accessScale") == "" ? 0 : this.getChildValue("swkx_cost_child", i, "accessScale");
    var packagePeriod = this.getChildValue("swkx_cost_child", i, "packagePeriod");
    var disposableCost = this.getChildValue("swkx_cost_child", i, "disposableCost") == "" ? 0 : this.getChildValue("swkx_cost_child", i, "disposableCost");
    var ipNumber = this.getChildValue("swkx_cost_child", i, "ipNumber") == "" ? 0 : this.getChildValue("swkx_cost_child", i, "ipNumber");
    var ipPrice = this.getChildValue("swkx_cost_child", i, "ipPrice") == "" ? 0 : this.getChildValue("swkx_cost_child", i, "ipPrice");
    var packageTemp = 1;
    if (packagePeriod == "包季度") {
      packageTemp = 3;
    } else if (packagePeriod == "包半年") {
      packageTemp = 6;
    } else if (packagePeriod == "包年") {
      packageTemp = 12;
    }
    //计算规则单条：（申请金额*接入规模*合同期+一次性费用）多条为单条相加
    total = total + (((applyAmount * 1 * accessScale * 1) + (ipPrice * 1 * accessScale * 1)))
      * contractPeriod / packageTemp + disposableCost * accessScale;
  }
  this.requestdSetVal("contractPeriodTotal", parseFloat((total / 10000).toFixed(6)));
  this.calculaTotalCost();//计算打分表
}
/**一次性费用转大写 非特批给默认值不能修改*/
this.nonrecurringChargesChange = (value) => {
  var charges = value.value;
  var valueDX = this.DX(charges);
  this.setChildConfigValue("swkx_busi_child", value.index, "nonrecurringChargesUppercase", valueDX);
}

/**业务信息中带宽切换 */
this.bandWidthChange = (value) => {
  //先赋值要不this.businessChange方法取不到
  this.setChildConfigValue("swkx_busi_child", value.index, "bandWidth", value.value);
  this.businessChange(value);

}
/**申请金额转大写 */
this.bandWidthChargesBlur = (value) => {
  this.businessChange(value);
}
/*校验业务表中资费是否低于标准价格 */
this.businessChange = (valurArr) => {
  var standardPrice = 0;
  var charges = this.getChildValue("swkx_busi_child", valurArr.index, "bandWidthCharges");
  //charges = charges.replace(/[^\-?\d.]/g, '');//替换下子表单的值
  var specialIs = this.formData.specialIs;
  if (specialIs == "否") {
    var bandWidth = this.getChildValue("swkx_busi_child", valurArr.index, "bandWidth");
    for (var i = 0; i < tariffArr.length; i++) {
      if (bandWidth == tariffArr[i].broadNumber) {
        for (var j = 0; j < tariffArr[i].property.length; j++) {
          var packageType = "包月";
          if (packageType == tariffArr[i].property[j].PACKAGE_PERIOD) {
            standardPrice = tariffArr[i].property[j].PRICE;
            //console.log(tariffArr[i].property[j].PRICE + "-----标准价格");
          }
        }
      }
    }
    if (charges != "") {
      if (standardPrice * 1 > charges * 1) {//小于标准价格赋值提示并赋值标准价格
        alert("第" + (valurArr.index + 1) + "条业务信息中的租用费价格低于标准价格，请重新填写！")
        this.setChildConfigValue("swkx_busi_child", valurArr.index, "bandWidthCharges", standardPrice);
        var valueDX = this.DX(standardPrice);
        this.setChildConfigValue("swkx_busi_child", valurArr.index, "bandWidthChargesUppercase", valueDX);
      } else {//溢价不处理
        this.setChildConfigValue("swkx_busi_child", valurArr.index, "bandWidthCharges", charges);
        //给业务表中大写字段赋值
        var valueDX = this.DX(charges);
        this.setChildConfigValue("swkx_busi_child", valurArr.index, "bandWidthChargesUppercase", valueDX);
      }
    } else {//为空赋值标准价格
      this.setChildConfigValue("swkx_busi_child", valurArr.index, "bandWidthCharges", standardPrice);
      //给业务表中大写字段赋值
      var valueDX = this.DX(standardPrice);
      this.setChildConfigValue("swkx_busi_child", valurArr.index, "bandWidthChargesUppercase", valueDX);
    }
  } else {
    this.setChildConfigValue("swkx_busi_child", valurArr.index, "bandWidthCharges", charges);
    //给业务表中大写字段赋值
    var valueDX = this.DX(charges);
    this.setChildConfigValue("swkx_busi_child", valurArr.index, "bandWidthChargesUppercase", valueDX);
  }
}

/**签章类型切换 */
this.signatureTypeChange = (value) => {
  this.hideShowContrat(value.value);
}


/**线路成本 */
this.catLineCost = () => {
  var contractPeriod = this.formData.contractPeriod;
  var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
  var total = 0;
  var lineconstructionCost = 0;
  var lineconstructionCostDesc = "";
  var lineDescTemp = "";
  lineconstructionCostDesc = zfnum == 1 ? "" : "(";
  for (let i = 0; i < zfnum; i++) {
    var accessScale = this.getChildValue("swkx_cost_child", i, "accessScale") == "" ? 0 : this.getChildValue("swkx_cost_child", i, "accessScale");
    total = total + accessScale * 153;
    lineDescTemp = lineDescTemp + accessScale + "*153+";
  }
  lineDescTemp = lineDescTemp.substr(0, lineDescTemp.length - 1);
  lineconstructionCostDesc = lineconstructionCostDesc + lineDescTemp +
    (zfnum == 1 ? "/10000" : ")/10000");
  this.requestdSetVal("lineconstructionCost", parseFloat((total / 10000).toFixed(6)));
  this.requestdSetVal("lineconstructionCostDesc", lineconstructionCostDesc);
}

/**结算成本 */
this.catSettleCost = () => {
  var contractPeriod = this.formData.contractPeriod;
  var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
  var total = 0;
  var settlementCost = 0;
  var settlementCostDesc = "";
  var settDescTemp = "";
  settlementCostDesc = zfnum == 1 ? "" : "(";
  for (let i = 0; i < zfnum; i++) {
    var accessScale = this.getChildValue("swkx_cost_child", i, "accessScale") == "" ? 0 : this.getChildValue("swkx_cost_child", i, "accessScale");
    var broadNumber = this.getChildValue("swkx_cost_child", i, "broadNumber");
    if (broadNumber.endsWith("20M")) {
      total = total + accessScale * 5.4 * contractPeriod;
      settDescTemp = settDescTemp + accessScale + "*5.4*" + contractPeriod + "+";
    } else if (broadNumber.endsWith("50M")) {
      total = total + accessScale * 6.4 * contractPeriod;
      settDescTemp = settDescTemp + accessScale + "*6.4*" + contractPeriod + "+";
    } else if (broadNumber.endsWith("100M")) {
      total = total + accessScale * 8.1 * contractPeriod;
      settDescTemp = settDescTemp + accessScale + "*8.1*" + contractPeriod + "+";
    } else if (broadNumber.endsWith("200M")) {
      total = total + accessScale * 10.8 * contractPeriod;
      settDescTemp = settDescTemp + accessScale + "*10.8*" + contractPeriod + "+";
    } else if (broadNumber.endsWith("500M")) {
      total = total + accessScale * 16.2 * contractPeriod;
      settDescTemp = settDescTemp + accessScale + "*16.2*" + contractPeriod + "+";
    } else if (broadNumber.endsWith("1000M")) {
      total = total + accessScale * 27 * contractPeriod;
      settDescTemp = settDescTemp + accessScale + "*27*" + contractPeriod + "+";
    }
  }
  settDescTemp = settDescTemp.substr(0, settDescTemp.length - 1);
  settlementCostDesc = settlementCostDesc + settDescTemp +
    (zfnum == 1 ? "/10000" : ")/10000");
  this.requestdSetVal("settlementCost", parseFloat((total / 10000).toFixed(6)));
  this.requestdSetVal("settlementCostDesc", settlementCostDesc);
}
/**渠道成本 */
this.caltChannelCost = () => {
  var salesCategory = this.formData.salesCategory;
  var contractPeriodTotal = this.formData.contractPeriodTotal;
  var channelRatio = "";
  var channelCost = "";
  var channelCostDesc = "";
  if (salesCategory == "" || salesCategory == "直销项目") {
    channelRatio = 0;
  } else if (salesCategory == "代理渠道项目") {
    channelRatio = 30;
  }
  if (contractPeriodTotal != "" && channelRatio != 0) {
    channelCost = parseFloat((contractPeriodTotal * 1 * channelRatio * 1 / 100).toFixed(6));
    this.requestdSetVal("channelCost", channelCost);
    this.requestdSetVal("channelCostDesc", contractPeriodTotal * 10000 + "*" + channelRatio / 100 + "/10000");
  } else {
    this.requestdSetVal("channelCost", "0");
    this.requestdSetVal("channelCostDesc", "无");
  }
}

/**客户侧成本 */
this.equipmentCostBlur = (value) => {
  this.calculaTotalCost();
}

/**其他成本 */
this.marketingCostBlur = (value) => {
  this.calculaTotalCost();
}
/**营销成本 */
this.otherCostBlur = (value) => {
  this.calculaTotalCost();
}

/*计算成本总金额 */
this.calculaTotalCost = () => {
  this.catLineCost();//线路成本
  this.catSettleCost();//结算成本
  this.caltChannelCost();//渠道成本
  var lineCost = this.formData.lineconstructionCost;
  if (lineCost == "") {//线路成本
    lineCost = lineCost == "" ? 0 : lineCost;
    this.requestdSetVal("lineconstructionCost", lineCost);
    this.requestdSetVal("lineconstructionCostDesc", "无");
  }
  var setCost = this.formData.settlementCost;
  if (setCost == "") {//结算成本
    setCost = setCost == "" ? 0 : setCost;
    this.requestdSetVal("settlementCost", setCost);
    this.requestdSetVal("settlementCostDesc", "无");
  }
  var channelCost = this.formData.channelCost;
  if (channelCost == "") {//渠道成本
    channelCost = channelCost == "" ? 0 : channelCost;
    this.requestdSetVal("channelCost", channelCost);
    this.requestdSetVal("channelCostDesc", "无");
  }
  var equipmentCost = this.formData.equipmentCost;
  if (equipmentCost == "") {//客户侧成本
    equipmentCost = equipmentCost == "" ? 0 : equipmentCost;
    this.requestdSetVal("equipmentCost", equipmentCost);
    this.requestdSetVal("equipmentCostDesc", "无");
  }
  var marketingCost = this.formData.marketingCost;
  if (marketingCost == "") {//渠道成本
    marketingCost = marketingCost == "" ? 0 : marketingCost;
    this.requestdSetVal("marketingCost", marketingCost);
    this.requestdSetVal("marketingCostDesc", "无");
  }
  var otherCost = this.formData.otherCost;
  if (otherCost == "") {//其它成本
    otherCost = otherCost == "" ? 0 : otherCost;
    this.requestdSetVal("otherCost", otherCost);
    this.requestdSetVal("otherCostDesc", "无");
  }
  var totalCost = lineCost * 1 + setCost * 1 + channelCost * 1 + equipmentCost * 1
    + marketingCost * 1 + otherCost * 1;
  this.requestdSetVal("amountTotal", parseFloat((totalCost * 1).toFixed(6)));//合同成本
  var contractPeriodTotal = this.formData.contractPeriodTotal;
  if (totalCost == 0) {
    this.requestdSetVal("ioCoefficient", 0)
  } else {
    this.requestdSetVal("ioCoefficient", parseFloat(((contractPeriodTotal * 1) / (totalCost * 1)).toFixed(6)));
  }
}

/*是否显示银行信息 */
this.showHiideBankInfo = () => {
  //初始化银行数据
  if (this.formData.paymentType == "银行托收") {
    this.requestdSetVal("customerCashFinancialContact", "");//财务联系人
    this.getNode("customerCashFinancialContact").style.display = "none";
    this.rules.customerCashFinancialContact[0].required = false;
    this.requestdSetVal("customerCashContactPhone", "");//财务联系人电话
    this.getNode("customerCashContactPhone").style.display = "none";
    this.rules.customerCashContactPhone[0].required = false;
    this.requestdSetVal("customerCashContactAddress", "");//联系地址
    this.getNode("customerCashContactAddress").style.display = "none";
    this.rules.customerCashContactAddress[0].required = false;
    this.requestdSetVal("customerCashPostalCode", "");//邮政编码
    this.getNode("customerCashPostalCode").style.display = "none";
    this.rules.customerCashPostalCode[0].required = false;

    this.getNode("customerDepositBank").style.display = "block";//客户开户银行
    this.rules.customerDepositBank[0].required = true;
    this.getNode("customerBankAccountNumber").style.display = "block";
    this.rules.customerBankAccountNumber[0].required = true;
    this.getNode("customerAccountName").style.display = "block";
    this.rules.customerAccountName[0].required = true;
    this.getNode("customerBankNumber").style.display = "block";
    this.rules.customerBankNumber[0].required = true;
  } else if (this.formData.paymentType == "转账支票") {
    this.requestdSetVal("customerDepositBank", "");//客户开户银行
    this.getNode("customerDepositBank").style.display = "none";
    this.rules.customerDepositBank[0].required = false;
    this.requestdSetVal("customerBankAccountNumber", "");//客户银行账号
    this.getNode("customerBankAccountNumber").style.display = "none";
    this.rules.customerBankAccountNumber[0].required = false;
    this.requestdSetVal("customerAccountName", "");//客户开户名称
    this.getNode("customerAccountName").style.display = "none";
    this.rules.customerAccountName[0].required = false;
    this.requestdSetVal("customerBankNumber", "");//客户银行编号
    this.getNode("customerBankNumber").style.display = "none";
    this.rules.customerBankNumber[0].required = false;

    this.getNode("customerCashFinancialContact").style.display = "block";
    this.rules.customerCashFinancialContact[0].required = true;
    this.getNode("customerCashContactPhone").style.display = "block";
    this.rules.customerCashContactPhone[0].required = true;
    this.getNode("customerCashContactAddress").style.display = "block";
    this.rules.customerCashContactAddress[0].required = true;
    this.getNode("customerCashPostalCode").style.display = "block";
    this.rules.customerCashPostalCode[0].required = true;
  } else {
    this.requestdSetVal("customerDepositBank", "");    //客户开户银行
    this.getNode("customerDepositBank").style.display = "none";
    this.rules.customerDepositBank[0].required = false;
    this.requestdSetVal("customerBankAccountNumber", "");//客户银行账号
    this.getNode("customerBankAccountNumber").style.display = "none";
    this.rules.customerBankAccountNumber[0].required = false;
    this.requestdSetVal("customerAccountName", "");//客户开户名称
    this.getNode("customerAccountName").style.display = "none";
    this.rules.customerAccountName[0].required = false;
    this.requestdSetVal("customerBankNumber", "");//客户银行编号
    this.getNode("customerBankNumber").style.display = "none";
    this.rules.customerBankNumber[0].required = false;

    this.requestdSetVal("customerCashFinancialContact", "");//财务联系人
    this.getNode("customerCashFinancialContact").style.display = "none";
    this.rules.customerCashFinancialContact[0].required = false;
    this.requestdSetVal("customerCashContactPhone", "");//财务联系人电话
    this.getNode("customerCashContactPhone").style.display = "none";
    this.rules.customerCashContactPhone[0].required = false;
    this.requestdSetVal("customerCashContactAddress", "");//联系地址
    this.getNode("customerCashContactAddress").style.display = "none";
    this.rules.customerCashContactAddress[0].required = false;
    this.requestdSetVal("customerCashPostalCode", "");//邮政编码
    this.getNode("customerCashPostalCode").style.display = "none";
    this.rules.customerCashPostalCode[0].required = false;
  }
}

/**销售类别显示隐藏 */
this.hideShowTariffCategory = (value) => {
  if (value == "竞争资费") {
    this.getNode("competitorPrice").style.display = "block";
    this.rules.competitorPrice = this.abc;
    console.log(this.rules.competitorPrice)
    this.getUpThreeNode("competAttach").style.display = "block";//竞争附件
    this.rules.competAttach[0].required = true;
  } else {
    this.requestdSetVal("competitorPrice", "");//友商报价
    this.getNode("competitorPrice").style.display = "none";
    this.abc = JSON.parse(JSON.stringify(this.rules.competitorPrice));
    this.rules.competitorPrice.length = 0;
    this.getUpThreeNode("competAttach").style.display = "none";//竞争附件
    this.rules.competAttach[0].required = false;
  }
}

/**是否为特批显示隐藏 */
this.showHideIsSpecial = (value) => {
  this.showHideMarkingTable(value);
  if (this.formData.specialIs == "是") {
    this.getNode("requirementDesc").style.display = "block";//需求描述
    this.rules.requirementDesc[0].required = true;
    this.getNode("tariffCategory").style.display = "block";//资费类别
    this.rules.tariffCategory[0].required = true;
    //审批层级
    this.getUpThreeNode("approvalLevels").style.display = "block";
    this.rules.approvalLevels[0].required = true;
  } else {
    this.getUpThreeNode("markingTable").style.display = "none";
    this.getUpThreeNode("appLevel").style.display = "none";

    this.requestdSetVal("requirementDesc", "");
    this.getNode("requirementDesc").style.display = "none";
    this.rules.requirementDesc[0].required = false;

    this.requestdSetVal("tariffCategory", "");
    this.getNode("tariffCategory").style.display = "none";//资费类别
    this.rules.tariffCategory[0].required = false;

    this.requestdSetVal("officialDocumentNum", "");
    this.getNode("officialDocumentNum").style.display = "none";//公文文号
    this.rules.officialDocumentNum[0].required = false;
    //审批层级
    this.getUpThreeNode("approvalLevels").style.display = "none";
    this.rules.approvalLevels[0].required = false;
  }
}

/**打分表显示隐藏 */
this.showHideMarkingTable = (value) => {
  if (this.formData.specialIs == "是" && (value == "普通折扣" || value == "竞争资费")) {
    //打分表显示
    this.getUpThreeNode("markingTable").style.display = "block";
    this.getNode("contractPeriod").style.display = "block";
    this.rules.contractPeriod[0].required = true;
    this.getNode("contractPeriodTotal").style.display = "block";
    this.rules.contractPeriodTotal[0].required = true;
    this.getNode("lineconstructionCost").style.display = "block";
    this.rules.lineconstructionCost[0].required = true;
    this.getNode("lineconstructionCostDesc").style.display = "block";
    this.rules.lineconstructionCostDesc[0].required = true;
    this.getNode("settlementCost").style.display = "block";
    this.rules.settlementCost[0].required = true;
    this.getNode("settlementCostDesc").style.display = "block";
    this.rules.settlementCostDesc[0].required = true;
    this.getNode("channelCost").style.display = "block";
    this.rules.channelCost[0].required = true;
    this.getNode("channelCostDesc").style.display = "block";
    this.rules.channelCostDesc[0].required = true;
    this.getNode("equipmentCost").style.display = "block";
    this.rules.equipmentCost[0].required = true;
    this.getNode("equipmentCostDesc").style.display = "block";
    this.rules.equipmentCostDesc[0].required = true;
    this.getNode("marketingCost").style.display = "block";
    this.rules.marketingCost[0].required = true;
    this.getNode("marketingCostDesc").style.display = "block";
    this.rules.marketingCostDesc[0].required = true;
    this.getNode("otherCost").style.display = "block";
    this.getNode("otherCostDesc").style.display = "block";
    this.getNode("amountTotal").style.display = "block";
    this.rules.amountTotal[0].required = true;
    this.getNode("ioCoefficient").style.display = "block";
    this.rules.ioCoefficient[0].required = true;
    this.getUpThreeNode("other1").style.display = "block";
  } else {
    //打分表全部隐藏
    this.getUpThreeNode("markingTable").style.display = "none";
    this.requestdSetVal("contractPeriod", "");
    this.getNode("contractPeriod").style.display = "none";
    this.rules.contractPeriod[0].required = false;
    this.requestdSetVal("contractPeriodTotal", "");
    this.getNode("contractPeriodTotal").style.display = "none";
    this.rules.contractPeriodTotal[0].required = false;
    this.requestdSetVal("lineconstructionCost", "");
    this.getNode("lineconstructionCost").style.display = "none";
    this.rules.lineconstructionCost[0].required = false;
    this.requestdSetVal("lineconstructionCostDesc", "");
    this.getNode("lineconstructionCostDesc").style.display = "none";
    this.rules.lineconstructionCostDesc[0].required = false;
    this.requestdSetVal("settlementCost", "");
    this.getNode("settlementCost").style.display = "none";
    this.rules.settlementCost[0].required = false;
    this.requestdSetVal("settlementCostDesc", "");
    this.getNode("settlementCostDesc").style.display = "none";
    this.rules.settlementCostDesc[0].required = false;
    this.requestdSetVal("channelCost", "");
    this.getNode("channelCost").style.display = "none";
    this.rules.channelCost[0].required = false;
    this.requestdSetVal("channelCostDesc", "");
    this.getNode("channelCostDesc").style.display = "none";
    this.rules.channelCostDesc[0].required = false;
    this.requestdSetVal("equipmentCost", "");
    this.getNode("equipmentCost").style.display = "none";
    this.rules.equipmentCost[0].required = false;
    this.requestdSetVal("equipmentCostDesc", "");
    this.getNode("equipmentCostDesc").style.display = "none";
    this.rules.equipmentCostDesc[0].required = false;
    this.requestdSetVal("marketingCost", "");
    this.getNode("marketingCost").style.display = "none";
    this.rules.marketingCost[0].required = false;
    this.requestdSetVal("marketingCostDesc", "");
    this.getNode("marketingCostDesc").style.display = "none";
    this.rules.marketingCostDesc[0].required = false;
    this.requestdSetVal("otherCost", "");
    this.getNode("otherCost").style.display = "none";
    this.requestdSetVal("otherCostDesc", "");
    this.getNode("otherCostDesc").style.display = "none";
    this.requestdSetVal("amountTotal", "");
    this.getNode("amountTotal").style.display = "none";
    this.rules.amountTotal[0].required = false;
    this.requestdSetVal("ioCoefficient", "");
    this.getNode("ioCoefficient").style.display = "none";
    this.rules.ioCoefficient[0].required = false;
    this.getUpThreeNode("other1").style.display = "none";//点击核算按钮
  }
}

/**导入后回填业务信息 */
this.backfillBusi = async (reg) => {
  var zfnum = this.getCodeChildFormData("swkx_cost_child").length;
  var accessScaleTotal = 0;
  var index = 0;
  for (let i = 0; i < zfnum * 1; i++) {
    var accessScale = this.getChildValue("swkx_cost_child", i, "accessScale");
    accessScaleTotal = accessScaleTotal + accessScale * 1;
  }
  if (accessScaleTotal > 0) {
    let result = await this.postData(
      "http://172.30.200.245:8090/GovernmenCustomerApprove/protocol/inExportExcel",
      {
        userCode: this.bpa.userId,
        filePath: reg.data[0].filePath
      })
    if (result.success) {//给回填赋值
      console.log(result.parmList);
      if (result.parmList.length == accessScaleTotal) {
        for (let j = 0; j < accessScaleTotal; j++) {
          this.setChildConfigValue("swkx_busi_child", j, "detailedAddress", result.parmList[j].param0);
          this.setChildConfigValue("swkx_busi_child", j, "busiRemarks", result.parmList[j].param1);
        }
      } else {
        alert("请核实excel中数据去掉标题的行数，与业务信息条数是否相同！");
      }
    } else {
      alert(result.message);
    }
  } else {
    alert("请先新增条目后，再导入数据！");
  }
}
