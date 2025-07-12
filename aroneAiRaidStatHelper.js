// ==UserScript==
// @name         Arona AI Raid Stat. Helper
// @version      v0.6
// @description  Gather student usage in different raids
// @author       Jacky Ho
// @match        https://arona.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=arona.ai
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.core.min.js
// @downloadURL  https://github.com/jacky1226-csl/Arona-AI-Raid-Stat.-Helper/raw/refs/heads/main/aroneAiRaidStatHelper.js
// @updateURL    https://github.com/jacky1226-csl/Arona-AI-Raid-Stat.-Helper/raw/refs/heads/main/aroneAiRaidStatHelper.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

let facts = {
  "summaryRank": ["1000", "5000", "10000", "20000"], // rank should exists in raid info
  "raidUrl": "https://media.arona.ai/data/v3/raid/<id>/total",
  "elimRaidUrl": "https://media.arona.ai/data/v3/eraid/<id>/total",
  "raidInfo": "https://schaledb.com/data/tw/raids.json",
  "studentUrl": "https://schaledb.com/data/tw/students.json",
  "enRaidInfo": "https://schaledb.com/data/en/raids.json",
  "enStudentUrl": "https://schaledb.com/data/en/students.json",
  "krRaidInfo": "https://schaledb.com/data/kr/raids.json",
  "krStudentUrl": "https://schaledb.com/data/kr/students.json",
  "shopRecruitExcelTableUrl": "https://raw.githubusercontent.com/electricgoat/ba-data/refs/heads/jp/Excel/ShopRecruitExcelTable.json"
}

let debugMode = false;

window.downloadInfo = async function (configJson) {
  // Steps:
  // 1. Get all raid info
  // 2. Determine which JP Raid is not done in Global server yet
  // 3. Get information of those raids
  // 4. Summary for the info
  // 5. Get student info
  // 5. Generate excel file

  let raidInfo = await getJsonRespond(facts.raidInfo);
  // RaidSeason got three outputs
  // [0] is JP server
  // [1] is global server
  // [2] is believed to be China server, not sure as I don't have those info
  // Seasons refer to 總力戰
  // EliminateSeasons refers to 大決戰

  let baseStudentInfo = await getJsonRespond(facts.studentUrl);

  let recStdInfo = await getJsonRespond(facts.shopRecruitExcelTableUrl);

  if(recStdInfo && recStdInfo.hasOwnProperty("DataList")) {
    recStdInfo.DataList.forEach(reqRec => {
      if(reqRec.hasOwnProperty("InfoCharacterId")
          && reqRec.InfoCharacterId.length > 0
          && reqRec.hasOwnProperty("SalePeriodFrom")
          && reqRec.SalePeriodFrom !== ''){
        reqRec.InfoCharacterId.forEach(stdId => {
          if(baseStudentInfo.hasOwnProperty(stdId)){
            if(baseStudentInfo[stdId].hasOwnProperty("lastPuDate")) {
              let tempDt = reqRec.SalePeriodFrom.split(" ")[0];
              if(baseStudentInfo[stdId].lastPuDate < tempDt){
                baseStudentInfo[stdId].lastPuDate = reqRec.SalePeriodFrom.split(" ")[0];
              }
            } else {
              baseStudentInfo[stdId].lastPuDate = reqRec.SalePeriodFrom.split(" ")[0];
            }

          }
        });
      }
    });
  }

  let currTime = (new Date()) / 1000; // timestamp in received objs are in s

  let gloRaidSessons = raidInfo.RaidSeasons[1].Seasons;
  let jpRaidSessons = raidInfo.RaidSeasons[0].Seasons;
  let gloElimRaidSessons = raidInfo.RaidSeasons[1].EliminateSeasons;
  let jpElimRaidSessons = raidInfo.RaidSeasons[0].EliminateSeasons;

  // as result should still include on-going raid, so check endtime is smaller current time
  let currGloRaidId = -1;
  for(let i = gloRaidSessons.length - 1; i >= 0 && currGloRaidId === -1; i--) {
    if(gloRaidSessons[i].End < currTime) {
      currGloRaidId = i;
    }
  }

  let currGloEimRaidId = -1;
  for(let i = gloElimRaidSessons.length - 1; i >= 0 && currGloEimRaidId === -1; i--) {
    if(gloElimRaidSessons[i].End < currTime) {
      currGloEimRaidId = i;
    }
  }

  // find the JP raids that are not happens yet
  // check for "current" and "previous" to make sure, as raid boss may repeat twice in half year
  // form a list of raids that information required
  let raidsToInclude = [];
  let stopFlag = false;
  for(let i = jpRaidSessons.length - 1; i >=0 && !stopFlag; i--){
    if(isSameRaid(jpRaidSessons[i], gloRaidSessons[currGloRaidId]) && i > 0
        && isSameRaid(jpRaidSessons[i - 1], gloRaidSessons[currGloRaidId - 1])) {
      stopFlag = true;
    } else {
      raidsToInclude.push(jpRaidSessons[i]);
    }
  }

  stopFlag = false;
  for(let i = jpElimRaidSessons.length - 1; i >=0 && !stopFlag; i--){
    if(isSameRaid(jpElimRaidSessons[i], gloElimRaidSessons[currGloEimRaidId]) && i > 0
        && isSameRaid(jpElimRaidSessons[i - 1], gloElimRaidSessons[currGloEimRaidId - 1])) {
      stopFlag = true;
    } else {
      raidsToInclude.push(jpElimRaidSessons[i]);
    }
  }

  raidsToInclude = raidsToInclude.sort((a, b) => {
    return a.Start - b.Start;
  });

  let studentInfo = {};
  let displayRaidOrder = [];
  let displayRaidName = [];
  // get info for each raid
  for(let i = 0; i < raidsToInclude.length; i++) {
    let raid = raidsToInclude[i];
    raid.hasInfo = false;

    let reqUrl = "";
    if(raid.hasOwnProperty("OpenDifficulty")) { // attribute only available for elim raid
      reqUrl = facts.elimRaidUrl.replace(/<id>/g, raid.SeasonDisplay);
    } else {
      reqUrl = facts.raidUrl.replace(/<id>/g, raid.SeasonDisplay);
    }

    console.log("Getting raid info from ", reqUrl);
    let raidResultInfo = await getJsonRespond(reqUrl);

    if(raidResultInfo) {
      // raidResultInfo will be null if got issue when get raid info
      raid.hasInfo = true;

      if(raid.hasOwnProperty("OpenDifficulty")) {
        Object.keys(raidResultInfo.characterUsage).forEach(elimRaidName => {
          if(!raid.hasOwnProperty("armors")) {
            raid.armors = [];
          }
          let armor = elimRaidName.split("_").at(-1);
          raid.armors.push(armor);
          let raidName = "e" + raid.SeasonDisplay + "_" + armor;
          setStudentInfo(studentInfo, raidName, raidResultInfo.characterUsage[elimRaidName].r, baseStudentInfo);
          displayRaidOrder.push(raidName);
        displayRaidName.push(translateTerm(armor) + " " + raidInfo.Raid[raid.RaidId - 1].Name + " " + translateTerm(raid.Terrain) + " 大決戰");
        });
      } else {
        let raidName = "r" + raid.SeasonDisplay;
        setStudentInfo(studentInfo, raidName, raidResultInfo.characterUsage.r, baseStudentInfo);
        displayRaidOrder.push(raidName);
        displayRaidName.push(raidInfo.Raid[raid.RaidId - 1].Name + " " + translateTerm(raid.Terrain) + " 總力");
      }
    }
  }

  // format excel sheets
  console.log("Start generating excel...");
  let resultWorkbook = XLSX.utils.book_new();
  let summarySheetHeaderCode = ["stdId", "name", "school", "lastPuDate", "pickupType", "cnt", "hundPerUpCnt", "fiftyPerUpCnt", "fivePerUpCnt", "max"];
  let summarySheetHeader = {
    "stdId": "學生ID",
    "name": "名稱",
    "school": "所屬學校",
    "lastPuDate": "日版PU日期",
    "pickupType": "類別",
    "cnt": "cnt",
    "hundPerUpCnt": ">100%",
    "fiftyPerUpCnt": ">50%",
    "fivePerUpCnt": ">5%",
    "max": "max"
  }

  for(let i = 0; i < displayRaidOrder.length; i++) {
    summarySheetHeaderCode.push(displayRaidOrder[i]);
    summarySheetHeader[displayRaidOrder[i]] = displayRaidName[i];
  }

  // prepare summary sheet
  for(let i = 0; i < facts.summaryRank.length; i++){
    let currRank = facts.summaryRank[i];
    let dataArr = []//[summarySheetHeader];
    Object.keys(studentInfo[currRank]).forEach(stdId => {
      dataArr.push(studentInfo[currRank][stdId]);
    });
    
    dataArr = dataArr.sort((a,b) => {
      if(typeof a.lastPuDate === "undefined") {
        if(typeof b.lastPuDate === "undefined")
          return 0;
        return 1;
      }
      if(typeof b.lastPuDate === "undefined")
        return -1;
      
      if(a.lastPuDate === b.lastPuDate)
        return 0;
      if(a.lastPuDate > b.lastPuDate)
        return -1;
      return 1;
    });
    dataArr.unshift(summarySheetHeader);
    
    console.log(dataArr);

    let sheetName = "";
    if(i === 0) {
      sheetName = "Summary - Rank " + currRank;
    } else {
      sheetName = "Summary - Rank " + facts.summaryRank[i - 1] + " to " + currRank;
    }

    let worksheet = XLSX.utils.json_to_sheet(dataArr, {header:summarySheetHeaderCode, skipHeader:true});
    
    XLSX.utils.book_append_sheet(resultWorkbook, worksheet, formatSheetName(sheetName));
  }

  // use the last summary rank as the total list of student
  // which is always true as even if 10000 - 20000 got no usage, 1 - 20000 will always get usage hence in list
  // note that technically this could be done in the previous large loop, but just splitting that to make the code easier to understand and maintain
  // well, we don't expect there would be many students, hence performance should be still ok... I think?

  console.log("Summary page done, generating sheets for each student...");
  let stdSheetHeaderCode = [];
  let stdSheetHeaderFirst = {};
  let stdSheetHeaderSecond = {};
  for(let i = 0; i < facts.summaryRank.length; i++) {
    for(let j = 0; j < 10; j++){
      // create number header code, each rank range will got 9 cols plus one separator
      stdSheetHeaderCode.push((10*i + j).toString());
    }
    stdSheetHeaderFirst[(10 * i).toString()] = i === 0
        ? (facts.summaryRank[i] + "以下")
        : facts.summaryRank[i-1] + " - " + facts.summaryRank[i];
    stdSheetHeaderSecond[(10 * i).toString()] = "Raid";
    stdSheetHeaderSecond[(10 * i + 1).toString()] = "借用";
    stdSheetHeaderSecond[(10 * i + 2).toString()] = "三星";
    stdSheetHeaderSecond[(10 * i + 3).toString()] = "四星";
    stdSheetHeaderSecond[(10 * i + 4).toString()] = "五星";
    stdSheetHeaderSecond[(10 * i + 5).toString()] = "專一";
    stdSheetHeaderSecond[(10 * i + 6).toString()] = "專二";
    stdSheetHeaderSecond[(10 * i + 7).toString()] = "專三";
    stdSheetHeaderSecond[(10 * i + 8).toString()] = "共計";
    stdSheetHeaderSecond[(10 * i + 9).toString()] = "";
  }

  Object.keys(studentInfo[facts.summaryRank.at(-1)]).forEach(stdId => {
    // each sheet
    let sheetInfo = [stdSheetHeaderFirst, stdSheetHeaderSecond];

    displayRaidOrder.forEach((raidId, raidIndex, raidList) => {
      // each row
      let rowInfo = {};

      facts.summaryRank.forEach((rank, rankIndex, rankList) => {
        // each rank

        rowInfo[(10*rankIndex).toString()] = displayRaidName[raidIndex];
        if(!studentInfo[rank].hasOwnProperty(stdId) || !studentInfo[rank][stdId].hasOwnProperty(raidId)){
          // student is not used in that rank of raid, set all data cell 0
          for(let j = 1; j < 9; j++){
            rowInfo[(10 * rankIndex + j).toString()] = 0;
          }
        } else {
          rowInfo[(10 * rankIndex + 1).toString()] = studentInfo[rank][stdId][raidId + "_arr"][0];
          rowInfo[(10 * rankIndex + 2).toString()] = studentInfo[rank][stdId][raidId + "_arr"][1];
          rowInfo[(10 * rankIndex + 3).toString()] = studentInfo[rank][stdId][raidId + "_arr"][2];
          rowInfo[(10 * rankIndex + 4).toString()] = studentInfo[rank][stdId][raidId + "_arr"][3];
          rowInfo[(10 * rankIndex + 5).toString()] = studentInfo[rank][stdId][raidId + "_arr"][4];
          rowInfo[(10 * rankIndex + 6).toString()] = studentInfo[rank][stdId][raidId + "_arr"][5];
          rowInfo[(10 * rankIndex + 7).toString()] = studentInfo[rank][stdId][raidId + "_arr"][6];
          rowInfo[(10 * rankIndex + 8).toString()] = studentInfo[rank][stdId][raidId + "_arr"][7];
        }
      });
      sheetInfo.push(rowInfo);
    });

    let sheetName = stdId + "-" + studentInfo[facts.summaryRank.at(-1)][stdId].name;
    let worksheet = XLSX.utils.json_to_sheet(sheetInfo, {header:stdSheetHeaderCode, skipHeader:true});
    XLSX.utils.book_append_sheet(resultWorkbook, worksheet, formatSheetName(sheetName));
  });

  let wbout = XLSX.write(resultWorkbook, {bookType: 'xlsx', type: 'array' });

  let blob = new Blob([wbout], { type: 'application/octet-stream' });
  let url = URL.createObjectURL(blob);

  let a = document.createElement('a');
  a.href = url;
  a.download = 'data.xlsx';
  a.click();

  URL.revokeObjectURL(url);

  if(debugMode) {
    window.gloRaidSessons = gloRaidSessons;
    window.jpRaidSessons = jpRaidSessons;
    window.gloElimRaidSessons = gloElimRaidSessons;
    window.jpElimRaidSessons = jpElimRaidSessons;
    window.raidsToInclude = raidsToInclude;
    window.baseStudentInfo = baseStudentInfo
    window.studentInfo = studentInfo;
    window.displayRaidOrder = displayRaidOrder;
    window.displayRaidName = displayRaidName;
  }
}

async function getJsonRespond(url) {
  try{
    let respond = await fetch(url);
    if(!respond.ok){
      return null;
    }

    return await respond.json();
  } catch (e) {
    console.error(e);
    return null;
  }
}

function setStudentInfo(studentInfo, raidName, usage, baseStudentInfo) {
  for(let i = 0; i < facts.summaryRank.length; i++) {
    let currRank = facts.summaryRank[i];
    let rankInfo = usage[currRank];
    let prevRankInfo = {};
    if(i !== 0) {
      prevRankInfo = usage[facts.summaryRank[i - 1]];
    }

    let teamCnt = ( i === 0 ? currRank : currRank - facts.summaryRank[i - 1]);

    if(!studentInfo.hasOwnProperty(currRank)) {
      studentInfo[currRank] = {};
    }

    Object.keys(rankInfo).forEach(stdId => {
      if(!studentInfo[currRank].hasOwnProperty(stdId)) {
        studentInfo[currRank][stdId] = {
          "stdId": stdId,
          "name": baseStudentInfo[stdId].Name,
          "school": translateSchoolName(baseStudentInfo[stdId].School),
          "lastPuDate": baseStudentInfo[stdId].lastPuDate,
          "pickupType": pickupTypeDescription(baseStudentInfo[stdId].IsLimited),
          "max": 0,
          "cnt": 0,
          "hundPerUpCnt": 0,
          "fiftyPerUpCnt": 0,
          "fivePerUpCnt": 0
        };
      }

      let sumCnt = 0;
      let usageArr = [];

      rankInfo[stdId].forEach((value, index) => {
        let res = value;
        if(prevRankInfo.hasOwnProperty(stdId)) {
            res -= prevRankInfo[stdId][index];
        }
        sumCnt += res;
        usageArr.push(res);
      });
      usageArr.push(sumCnt);

      if(sumCnt > 0) {
        studentInfo[currRank][stdId].cnt++;
        studentInfo[currRank][stdId][raidName] = sumCnt;
      }
      if(sumCnt > studentInfo[currRank][stdId].max) {
        studentInfo[currRank][stdId].max = sumCnt;
      }
      if(sumCnt > teamCnt) {
       studentInfo[currRank][stdId].hundPerUpCnt++;
      }
      if(sumCnt >= teamCnt * 0.5) {
        studentInfo[currRank][stdId].fiftyPerUpCnt++;
      }
      if(sumCnt >= teamCnt * 0.05) {
        studentInfo[currRank][stdId].fivePerUpCnt++;
      }

      studentInfo[currRank][stdId][raidName + "_arr"] = usageArr;
    });
  }
}

function isSameRaid(a, b) {
  // compare the boss
  if(a.RaidId !== b.RaidId)
    return false;

  // compare the terrain
  if(a.Terrain !== b.Terrain)
    return false;

  if(a.hasOwnProperty("OpenDifficulty") || b.hasOwnProperty("OpenDifficulty")) {
    // is elim raid, so also compare armor types
    if(!a.hasOwnProperty("OpenDifficulty") || !b.hasOwnProperty("OpenDifficulty")) {
      return false;
    }
    let aKeys = Object.keys(a.OpenDifficulty).sort();
    let bKeys = Object.keys(b.OpenDifficulty).sort();

    if(aKeys.length != bKeys.length){
      return false;
    }

    for(let i = 0; i < aKeys.length; i++){
      if(aKeys[i] !== bKeys[i]){
        return false;
      }
    }
  }

  return true;
}

function translateTerm(s) {
  if(s === "Outdoor")
    return "野外";
  if(s === "Indoor")
    return "室內";
  if(s === "Street")
    return "城鎮";
  if(s === "LightArmor")
    return "輕甲";
  if(s === "HeavyArmor")
    return "重甲";
  if(s === "Unarmed")
    return "神秘";
  if(s === "ElasticArmor")
    return "彈力";
  throw new Error(s + ' is not translated!');
}

function translateSchoolName(s) {
	if(s === "Abydos")
		return "阿拜多斯";
	if(s === "Arius")
		return "奧利斯";
	if(s === "Gehenna")
		return "格黑娜";
	if(s === "Highlander")
		return "高地人";
	if(s === "Hyakkiyako")
		return "百鬼夜行";
	if(s === "Millennium")
		return "千年";
	if(s === "RedWinter")
		return "赤冬";
	if(s === "SRT")
		return "SRT";
	if(s === "Shanhaijing")
		return "山海經";
	if(s === "Trinity")
		return "三一";
	if(s === "Valkyrie")
		return "女武神";
  return "其他";
}

function pickupTypeDescription(s) {
  if(s === 3)
    return "Fes";
  if(s === 2)
    return "活動";
  if(s === 1)
    return "限定";
  return "常態";
}

function formatSheetName(s) {
  return s.replace(/[\/\\?*[\]＊]/g, '').trim().slice(0, 31);
}

console.log("呼叫 downloadInfo() 以整合總力戰/大決戰數據");

})();