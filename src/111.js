var tariffArr = new Array();
var arr = new Array();
//表单加载前执行方法
this.init = async () => {
    this.getTraiff();//获取资费信息
}
//监听点击添加事件
this.listenAddClick = (value) => {
    //console.log(value)
    var index = value.index;
    var indexNew = index - 1;
    if (value.code == "ceshiywzb") {
        this.setChildConfigValue("ceshiywzb", value.index, "number", (value.index + 1));
        this.setChildOptionValue("ceshiywzb", value.index, "bandWidth", arr);
    } else if (value.code == "ceshizf") {
        this.setChildOptionValue("ceshizf", value.index, "broadNumber", arr);
    }
    return value.value
}

/**获取套餐并给子表单赋值 */
this.getTraiff = async () => {
    var specialIs = this.formData.specialIs;  //是否为特批
    var tariffCategory = this.formData.tariffCategory;//资费类别
    console.log(specialIs + "----->" + tariffCategory);
    let result = await this.postData(
        "http://172.30.200.245:8090/GovernmenCustomerApprove/protocol/findTariffs",
        {
            crmDevise: '112030200001',
            isSpecial: specialIs,
            tariffsType: tariffCategory
        }
    )
    tariffArr = result.broadList;
    //console.log(tariffArr);
    if (result.broadList.length > 0) {
        arr.length = 0;//清空数组
        for (let i = 0; i < result.broadList.length; i++) {
            var obj = {
                "label": result.broadList[i].broadNumber,
                "value": result.broadList[i].broadNumber
            };
            arr.push(obj);
        }
        var zfnum = this.getCodeChildFormData("ceshizf").length;
        for (let j = 0; j < zfnum; j++) {
            this.setChildOptionValue("ceshizf", j, "broadNumber", arr);//下拉框输入框
        }
        var ywnum = this.getCodeChildFormData("ceshiywzb").length;
        for (let j = 0; j < ywnum; j++) {
            this.setChildOptionValue("ceshiywzb", j, "bandWidth", arr);//下拉框输入框
        }
    }
}

/**监听主表资费类别变化 */
this.tariffCategoryChange = async (value) => {
    this.hideShowTariffCategory();
    this.getTraiff();
}

/**监听申请资费中子表单变化 */
this.broadNumberChange = (value) => {
    console.log(value.value + "-----value.value")
    var packagePeriodArr = new Array();
    for (var i = 0; i < tariffArr.length; i++) {
        if (value.value == tariffArr[i].broadNumber) {
            for (var j = 0; j < tariffArr[i].property.length; j++) {
                var obj = {
                    "label": tariffArr[i].property[j].PACKAGE_PERIOD,
                    "value": tariffArr[i].property[j].PACKAGE_PERIOD
                }
                packagePeriodArr.push(obj)
            }
        }
    }
    //console.log(packagePeriodArr)
    this.setChildOptionValue("ceshizf", value.index, "packagePeriod", packagePeriodArr)
}

/**监听子表单套餐变化 */
this.packagePeriodChange = (value) => {
    var boadInfo = this.getChildValue("ceshizf", value.index, "broadNumber");
    for (var i = 0; i < tariffArr.length; i++) {
        if (boadInfo == tariffArr[i].broadNumber) {
            for (var j = 0; j < tariffArr[i].property.length; j++) {
                if (value.value == tariffArr[i].property[j].PACKAGE_PERIOD) {
                    console.log(tariffArr[i].property[j].PRICE);
                    this.setChildConfigValue("ceshizf", value.index, "standardPrice", tariffArr[i].property[j].PRICE);
                }
            }
        }
    }
    // console.log(this.getChildValue("ceshizf", value.index, "applyAmount"));
    // console.log(this.getChildValue("ceshizf", value.index, "packagePeriod"));
    // this.calDiscount(value.index);
}

/**监听申请金额变化 */
this.applyAmountChange = (value) => {
    this.calDiscount(value.index);
}

/**计算资费子表中的折扣 */
this.calDiscount = (num) => {
    this.hideChildFiveItem("month", 0, "none")
    var applyAmount = this.getChildValue("ceshizf", num, "applyAmount") == "" ? 0 : this.getChildValue("ceshizf", num, "applyAmount");
    var standardPrice = this.getChildValue("ceshizf", num, "standardPrice") == "" ? 0 : this.getChildValue("ceshizf", num, "standardPrice");
    var discount = this.getChildValue("ceshizf", num, "discount");
    if (standardPrice == "" || standardPrice == "0") {
        discount = 0;
    } else {
        discount = applyAmount * 1 / standardPrice * 1 * 100
    }
    console.log(applyAmount);
    discount = discount.toFixed(2);
    this.setChildConfigValue("ceshizf", num, "discount", discount);
    // setTimeout(() => {
    //     this.hideChildFiveItem("month", 0, "none")
    // }, 1000)
}

this.contractPeriodChange=(value)=>{
    var contractPeriod = value.value;
    var total = 0;
    var zfnum = this.getCodeChildFormData("ceshizf").length;
    for (let i = 0; i < zfnum; i++) {
        var applyAmount = this.getChildValue("ceshizf",i,"applyAmount")==""?0:this.getChildValue("ceshizf",i,"applyAmount");
        var accessScale = this.getChildValue("ceshizf",i,"accessScale")==""?0:this.getChildValue("ceshizf",i,"accessScale");
        var disposableCost = this.getChildValue("ceshizf",i,"disposableCost")==""?0:this.getChildValue("ceshizf",i,"disposableCost");
        //计算规则单条：（申请金额*接入规模*合同期+一次性费用）多条为单条相加
        total = total + (applyAmount*1*accessScale*1)*contractPeriod + disposableCost;
    }
    this.requestdSetVal("contractPeriodTotal", parseFloat((total/10000).toFixed(6)) );
}

this.sealBack = () => {
    this.postData(
        "http://172.30.200.245:8090/GovernmenCustomerApprove/protocol/protocolModel",
        {
            applyId: this.bpa.bizId,
            applyStatus: "3"
        }
    ).then(function (data) { });
}

//提交前回调
this.submitFormBack = (value) => {
    var flag = false;
    if (this.formData.approvalAttach != "") {
        flag = true;
    }
    return { value, isSubmit: flag, message: "111" };
}

//关闭流程前回调 this.bpa.bizId
this.closeFormBack = () => {
    this.postData(
        "http://172.30.200.245:8090/GovernmenCustomerApprove/protocol/upateApplyStatus",
        {
            applyId: this.bpa.bizId,
            applyStatus: "99"
        }
    ).then(function (data) { });
};

this.endInit = async () => {
    //给readonly赋值样式
    document.querySelector("#applyPersonName").style.background = "#F5F7F9";
    document.querySelector("#applyPersonDeptName").style.background = "#F5F7F9";
    document.querySelector("#applyPersonPhone").style.background = "#F5F7F9";
    document.querySelector("#applyCodeNum").style.background = "#F5F7F9";
    document.querySelector("#applyStatus").style.background = "#F5F7F9";
    document.querySelector("#lineNumber").style.background = "#F5F7F9";
    document.querySelector("#amountTotal").style.background = "#F5F7F9";
    document.querySelector("#ioCoefficient").style.background = "#F5F7F9";
    document.querySelector("#ipTotalCost").style.background = "#F5F7F9";
    document.querySelector("#disposableTotalCost").style.background = "#F5F7F9";
    document.querySelector("#rentalChargesTotalCost").style.background = "#F5F7F9";
    document.querySelector("#tvFunctTotalCost").style.background = "#F5F7F9";
    document.querySelector("#contractPeriodTotal").style.background = "#F5F7F9";

    //赋值不显示
    this.getNode("specialIs").style.display = "none";//是否为特批
    this.getNode("demandType").style.display = "none";//策划种类
    this.getNode("applyPersonCode").style.display = "none";//申请人4A
    this.getNode("applyPersonDeptCode").style.display = "none";//申请人部门
    this.getNode("applyStatus").style.display = "none";//申请状态
    this.getNode("lineNumber").style.display = "none";//审批路径

    //是否是特批控制显示隐藏
    if (this.formData.specialIs == "0") {
        this.requestdSetVal("specialIs", "否");
    } else {
        this.requestdSetVal("specialIs", "是");
    }
    //特批编号获取
    var origin = this.bpa.origin;
    if (origin == "DRAFT_CENTER" || origin == "DRAFT_BOX") {//新增查询特批编号
        if (origin == "DRAFT_CENTER") {
            let result = await this.postData(
                "http://172.30.200.245:8090/GovernmenCustomerApprove/protocol/findProtocolNumCode",
                {
                    userCode: this.bpa.userCode
                })
            this.requestdSetVal("applyCodeNum", result.applyCodeNum);
        }

        //需要赋值显示字段
        this.requestdSetVal("applyPersonCode", this.bpa.userId);
        this.requestdSetVal("applyPersonDeptCode", this.bpa.orgId);
        this.requestdSetVal("applyPersonName", this.bpa.userName);
        this.requestdSetVal("applyPersonDeptName", this.bpa.orgName);
        this.requestdSetVal("applyPersonPhone", this.bpa.userDetails.mobilePhone);
    }
    this.showHideMarkingTable();
    this.showHiideBankInfo();
    this.hideShowSalesCategory();
    this.hideShowTariffCategory();
    this.hideShowContrat();

    //事件onblur    onclick onchange
    document.querySelector("#paymentType").onblur = async () => {
        this.showHiideBankInfo();
    }

    document.querySelector("#salesCategory").onchange = async () => {
        this.hideShowSalesCategory();
    }
    document.querySelector("#signatureType").onblur = async () => {
        this.hideShowContrat();
    }

    document.querySelector("#other1").onclick = async () => {
        this.calculaTotalCost();//计算打分表

        console.log("测试在方法中给子标签赋值成功！")
    }


}

/*计算成本总金额 */
this.calculaTotalCost = () => {
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
    this.requestdSetVal("amountTotal", totalCost * 1);//合同成本
    var contractPeriodTotal = this.formData.contractPeriodTotal;
    if (totalCost == 0) {
        this.requestdSetVal("ioCoefficient", 0)
    } else {
        this.requestdSetVal("ioCoefficient", (contractPeriodTotal * 1) / (totalCost * 1))
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
/**销售渠道显示隐藏 */
this.hideShowSalesCategory = () => {
    if (this.formData.salesCategory == "直销项目") {
        this.requestdSetVal("agentName", "");//渠道商名称
        this.getNode("agentName").style.display = "none";
        this.rules.agentName[0].required = false;
        this.requestdSetVal("agentDepartment", "");//渠道商部门
        this.getNode("agentDepartment").style.display = "none";
        this.rules.agentDepartment[0].required = false;
        //document.querySelector("#channelAttach").value=""//渠道商附件
        this.getUpThreeNode("channelAttach").style.display = "none";
        this.rules.channelAttach[0].required = false;
    } else {
        this.getNode("agentName").style.display = "block";
        this.rules.agentName[0].required = true;
        this.getNode("agentDepartment").style.display = "block";
        this.rules.agentDepartment[0].required = true;
        this.getNode("channelAttach").style.display = "block";
        this.getUpThreeNode("channelAttach").style.display = "block";
        this.rules.channelAttach[0].required = true;
    }
}
/**销售类别显示隐藏 */
this.hideShowTariffCategory = () => {
    if (this.formData.tariffCategory == "竞争资费") {
        this.getNode("competitorPrice").style.display = "block";
        this.rules.competitorPrice[0].required = true;
        this.getUpThreeNode("competAttach").style.display = "block";//竞争附件
        this.rules.competAttach[0].required = true;
        this.getUpThreeNode("propertyAttach").style.display = "none";
        this.rules.propertyAttach[0].required = false;
    } else if (this.formData.tariffCategory == "物业体验期") {
        this.getUpThreeNode("propertyAttach").style.display = "block";
        this.rules.propertyAttach[0].required = true;
        this.requestdSetVal("competitorPrice", "");//友商报价
        this.getNode("competitorPrice").style.display = "none";
        this.rules.competitorPrice[0].required = false;
        this.getUpThreeNode("competAttach").style.display = "none";//竞争附件
        this.rules.competAttach[0].required = false;
    } else {
        this.requestdSetVal("competitorPrice", "");//友商报价
        this.getNode("competitorPrice").style.display = "none";
        this.rules.competitorPrice[0].required = false;
        this.getUpThreeNode("competAttach").style.display = "none";//竞争附件
        this.rules.competAttach[0].required = false;
        this.getUpThreeNode("propertyAttach").style.display = "none";
        this.rules.propertyAttach[0].required = false;
    }
}
/**打分表显示隐藏 */
this.showHideMarkingTable = () => {
    if (this.formData.specialIs == "是") {
        this.getNode("opportunityNum").style.display = "block";//商机编号
        this.getNode("customerBackground").style.display = "block";//背景描述
        this.rules.customerBackground[0].required = true;
        this.getNode("requirementDesc").style.display = "block";//需求描述
        this.rules.requirementDesc[0].required = true;
        this.getNode("tariffCategory").style.display = "block";//资费类别
        this.rules.tariffCategory[0].required = true;
        //审批层级
        this.getUpThreeNode("approvalLevels").style.display = "block";
        this.rules.approvalLevels[0].required = true;
        //打分表显示
        this.getNode("hisContributionTotal").style.display = "block";
        //this.rules.hisContributionTotal[0].required=true;
        this.getNode("competeInfo").style.display = "block";
        //this.rules.competeInfo[0].required=true;
        this.getNode("competitionDetails").style.display = "block";
        //this.rules.competitionDetails[0].required=true;
        this.getNode("contractPeriod").style.display = "block";
        //this.rules.contractPeriod[0].required=true;
        this.getNode("payPeriod").style.display = "block";
        //this.rules.payPeriod[0].required=true;
        this.getNode("contractPeriodTotal").style.display = "block";
        //this.rules.contractPeriodTotal[0].required=true;
        this.getNode("lineconstructionCost").style.display = "block";
        //this.rules.lineconstructionCost[0].required=true;
        this.getNode("lineconstructionCostDesc").style.display = "block";
        //this.rules.lineconstructionCostDesc[0].required=true;
        this.getNode("settlementCost").style.display = "block";
        //this.rules.settlementCost[0].required=true;
        this.getNode("settlementCostDesc").style.display = "block";
        //this.rules.settlementCostDesc[0].required=true;
        this.getNode("channelCost").style.display = "block";
        //this.rules.channelCost[0].required=true;
        this.getNode("channelCostDesc").style.display = "block";
        //this.rules.channelCostDesc[0].required=true;
        this.getNode("equipmentCost").style.display = "block";
        //this.rules.equipmentCost[0].required=true;
        this.getNode("equipmentCostDesc").style.display = "block";
        //this.rules.equipmentCostDesc[0].required=true;
        this.getNode("marketingCost").style.display = "block";
        //this.rules.marketingCost[0].required=true;
        this.getNode("marketingCostDesc").style.display = "block";
        //this.rules.marketingCostDesc[0].required=true;
        this.getNode("otherCost").style.display = "block";
        this.getNode("otherCostDesc").style.display = "block";
        this.getNode("amountTotal").style.display = "block";
        this.rules.amountTotal[0].required = true;
        this.getNode("ioCoefficient").style.display = "block";
        this.rules.ioCoefficient[0].required = true;
        this.getUpThreeNode("other1").style.display = "block";

    } else {
        this.isShowChildForm("ceshizf", false);//隐藏资费表单
        this.requestdSetVal("opportunityNum", "");
        this.getNode("opportunityNum").style.display = "none";
        this.requestdSetVal("customerBackground", "");
        this.getNode("customerBackground").style.display = "none";
        this.rules.customerBackground[0].required = false;
        this.requestdSetVal("requirementDesc", "");
        this.getNode("requirementDesc").style.display = "none";
        this.rules.requirementDesc[0].required = false;
        this.requestdSetVal("tariffCategory", "");
        this.getNode("tariffCategory").style.display = "none";//资费类别
        this.rules.tariffCategory[0].required = false;
        //审批层级
        this.requestdSetVal("approvalLevels", "");
        this.getUpThreeNode("approvalLevels").style.display = "none";
        this.rules.approvalLevels[0].required = false;
        //打分表全部隐藏
        this.requestdSetVal("hisContributionTotal", "");//历史贡献
        this.getNode("hisContributionTotal").style.display = "none";
        //this.rules.hisContributionTotal[0].required=false;
        this.requestdSetVal("competeInfo", "");
        this.getNode("competeInfo").style.display = "none";
        //this.rules.competeInfo[0].required=false;
        this.requestdSetVal("competitionDetails", "");
        this.getNode("competitionDetails").style.display = "none";
        //this.rules.competitionDetails[0].required=false;
        this.requestdSetVal("contractPeriod", "");
        this.getNode("contractPeriod").style.display = "none";
        //this.rules.contractPeriod[0].required=false;
        this.requestdSetVal("payPeriod", "");
        this.getNode("payPeriod").style.display = "none";
        //this.rules.payPeriod[0].required=false;
        this.requestdSetVal("contractPeriodTotal", "");
        this.getNode("contractPeriodTotal").style.display = "none";
        //this.rules.contractPeriodTotal[0].required=false;
        this.requestdSetVal("lineconstructionCost", "");
        this.getNode("lineconstructionCost").style.display = "none";
        //this.rules.lineconstructionCost[0].required=false;
        this.requestdSetVal("lineconstructionCostDesc", "");
        this.getNode("lineconstructionCostDesc").style.display = "none";
        //this.rules.lineconstructionCostDesc[0].required=false;
        this.requestdSetVal("settlementCost", "");
        this.getNode("settlementCost").style.display = "none";
        //this.rules.settlementCost[0].required=false;
        this.requestdSetVal("settlementCostDesc", "");
        this.getNode("settlementCostDesc").style.display = "none";
        //this.rules.settlementCostDesc[0].required=false;
        this.requestdSetVal("channelCost", "");
        this.getNode("channelCost").style.display = "none";
        //this.rules.channelCost[0].required=false;
        this.requestdSetVal("channelCostDesc", "");
        this.getNode("channelCostDesc").style.display = "none";
        //this.rules.channelCostDesc[0].required=false;
        this.requestdSetVal("equipmentCost", "");
        this.getNode("equipmentCost").style.display = "none";
        //this.rules.equipmentCost[0].required=false;
        this.requestdSetVal("equipmentCostDesc", "");
        this.getNode("equipmentCostDesc").style.display = "none";
        //this.rules.equipmentCostDesc[0].required=false;
        this.requestdSetVal("marketingCost", "");
        this.getNode("marketingCost").style.display = "none";
        //this.rules.marketingCost[0].required=false;
        this.requestdSetVal("marketingCostDesc", "");
        this.getNode("marketingCostDesc").style.display = "none";
        //this.rules.marketingCostDesc[0].required=false;
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
/**合同信息显示隐藏 */
this.hideShowContrat = () => {
    var applyStatus = this.formData.applyStatus;
    if (applyStatus == "3" || applyStatus == "4" || applyStatus == "5"
        || applyStatus == "6" || applyStatus == "7") {
        this.getNode("signatureType").style.display = "block";
        this.rules.signatureType[0].required = true;
        this.getUpThreeNode("tariffAttach").style.display = "block";
        this.rules.tariffAttach[0].required = true;
        if (applyStatus == "3") {
            this.isSeal = true;
            this.hideShowSignatureType();

        } else {
            this.isSeal = false;
            var signatureType = this.formData.signatureType;
            //console.log(signatureType);
            if (signatureType == "双方线下") {
                this.getUpThreeNode("protocolAttach").style.display = "block";
                this.rules.protocolAttach[0].required = true;
                this.getUpThreeNode("registerAttach").style.display = "block";
                this.rules.protocolAttach[0].required = true;

                this.getUpThreeNode("protocolTempAttach").style.display = "none";
                this.rules.protocolTempAttach[0].required = false;
                this.getUpThreeNode("registerTempAttach").style.display = "none";
                this.rules.registerTempAttach[0].required = false;


            } else if (signatureType == "双方线上") {
                this.getUpThreeNode("protocolTempAttach").style.display = "none";
                this.rules.protocolTempAttach[0].required = false;
                this.getUpThreeNode("registerTempAttach").style.display = "none";
                this.rules.registerTempAttach[0].required = false;
                this.getUpThreeNode("protocolAttach").style.display = "block";
                this.rules.protocolAttach[0].required = true;
                this.getUpThreeNode("registerAttach").style.display = "block";
                this.rules.registerAttach[0].required = true;

            } else if (signatureType == "单方线上") {
                this.getUpThreeNode("protocolTempAttach").style.display = "block";
                this.rules.protocolTempAttach[0].required = true;
                this.getUpThreeNode("registerTempAttach").style.display = "block";
                this.rules.registerTempAttach[0].required = true;
                this.getUpThreeNode("protocolAttach").style.display = "block";
                this.rules.protocolAttach[0].required = true;
                this.getUpThreeNode("registerAttach").style.display = "block";
                this.rules.registerAttach[0].required = true;
            }
        }
    } else {
        this.getNode("signatureType").style.display = "none";
        this.rules.signatureType[0].required = false;
        this.getUpThreeNode("protocolTempAttach").style.display = "none";
        this.rules.protocolTempAttach[0].required = false;
        this.getUpThreeNode("registerTempAttach").style.display = "none";
        this.rules.registerTempAttach[0].required = false;
        this.getUpThreeNode("protocolAttach").style.display = "none";
        this.rules.protocolAttach[0].required = false;
        this.getUpThreeNode("registerAttach").style.display = "none";
        this.rules.registerAttach[0].required = false;
        this.getUpThreeNode("tariffAttach").style.display = "none";
        this.rules.tariffAttach[0].required = false;
        this.isSeal = false;
    }
}
/**合同附件按钮隐藏 */
this.hideShowSignatureType = () => {
    var signatureType = this.formData.signatureType;
    if (signatureType == "双方线下") {
        this.getUpThreeNode("protocolAttach").style.display = "block";
        this.rules.protocolAttach[0].required = true;
        this.getUpThreeNode("registerAttach").style.display = "block";
        this.rules.protocolAttach[0].required = true;

        this.getUpThreeNode("protocolTempAttach").style.display = "none";
        this.rules.protocolTempAttach[0].required = false;
        this.getUpThreeNode("registerTempAttach").style.display = "none";
        this.rules.registerTempAttach[0].required = false;
        this.isSubmit = true;
        this.isSeal = false;

    } else if (signatureType == "双方线上") {
        this.getUpThreeNode("protocolTempAttach").style.display = "none";
        this.rules.protocolTempAttach[0].required = false;
        this.getUpThreeNode("registerTempAttach").style.display = "none";
        this.rules.registerTempAttach[0].required = false;
        this.getUpThreeNode("protocolAttach").style.display = "none";
        this.rules.protocolAttach[0].required = false;
        this.getUpThreeNode("registerAttach").style.display = "none";
        this.rules.registerAttach[0].required = false;
        this.isSubmit = false;
        this.isSeal = true;
    } else {  //if (signatureType == "单方线上")
        this.getUpThreeNode("protocolTempAttach").style.display = "none";
        this.rules.protocolTempAttach[0].required = false;
        this.getUpThreeNode("registerTempAttach").style.display = "none";
        this.rules.registerTempAttach[0].required = false;
        this.getUpThreeNode("protocolAttach").style.display = "none";
        this.rules.protocolAttach[0].required = false;
        this.getUpThreeNode("registerAttach").style.display = "none";
        this.rules.registerAttach[0].required = false;
        this.isSubmit = false;
        this.isSeal = true;
    }
}
