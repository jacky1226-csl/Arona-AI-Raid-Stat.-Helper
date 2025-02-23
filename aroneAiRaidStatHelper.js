// ==UserScript==
// @name         Arona AI Raid Stat. Helper
// @version      v0.2
// @description  Geather student usage in different raids
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

let factInfo = {
  "summaryRank": ["1000", "5000", "10000", "20000"],
  "raidUrl": "https://media.arona.ai/data/v3/raid/<id>/total",
  "eraidUrl": "https://media.arona.ai/data/v3/eraid/<id>/total",
  "raidInfo": "https://schaledb.com/data/tw/raids.json",
  "studentUrl": "https://schaledb.com/data/tw/students.json",
  "enRaidInfo": "https://schaledb.com/data/en/raids.json",
  "enStudentUrl": "https://schaledb.com/data/en/students.json",
  "krRaidInfo": "https://schaledb.com/data/kr/raids.json",
  "krStudentUrl": "https://schaledb.com/data/kr/students.json"
}

window.downloadInfo = async function (inJson) {
  if(inJson && inJson.hasOwnProperty("currRaidId")){
    currExpRiadId = inJson.currRaidId;
  }
  if(inJson && inJson.hasOwnProperty("currEraidId")) {
    currExpEriadId = inJson.currEraidId;
  }
  if(inJson && inJson.hasOwnProperty("maxNoRaid")) {
    tarNoRaid = inJson.maxNoRaid;
  }
  
  let stdInfo = await getJsonRespond(factInfo.studentUrl);
  if(stdInfo === null) {
    console.error("Fail to fetch student info!");
    return;
  }
  
  let raidInfo = await getJsonRespond(factInfo.raidInfo);
  if(raidInfo === null) {
    console.error("Fail to fetch raid info!");
    return;
  }
  
  let currTwRaid = raidInfo.RaidSeasons[1].Seasons.at(-1);
  if(currTwRaid.End > (new Date()) / 1000){
    currTwRaid = raidInfo.RaidSeasons[1].Seasons.at(-2);
  }
  let jpRaids = raidInfo.RaidSeasons[0].Seasons;
  let refJpRaid = jpRaids.length;
  
  //console.log(currTwRaid);
  
  let currTwEraid = raidInfo.RaidSeasons[1].EliminateSeasons.at(-1);
  if(currTwEraid.End > (new Date()) / 1000){
    currTwEraid = raidInfo.RaidSeasons[1].EliminateSeasons.at(-2);
  }
  let jpEraids = raidInfo.RaidSeasons[0].EliminateSeasons;
  let refJpEraid = jpEraids.length;
  
  let raidMap = {};
  let eraidMap = {};

  refJpRaid--;
   while(!isSameRaid(jpRaids[refJpRaid], currTwRaid)){
    let currRaid = jpRaids[refJpRaid];
    raidMap[currRaid.SeasonDisplay] = {
      "name": raidInfo.Raid[currRaid.RaidId - 1].Name + " " + translateTerm(currRaid.Terrain)
    }
    refJpRaid--;
  }
 
  refJpEraid--;
  while(!isSameRaid(jpEraids[refJpEraid], currTwEraid)){
    let currEraid = jpEraids[refJpEraid];
    eraidMap[currEraid.SeasonDisplay] = {
      "name": raidInfo.Raid[currEraid.RaidId - 1].Name + " " + translateTerm(currEraid.Terrain)
    }
    refJpEraid--;
  }
  
  let searchRaid = {};
  let searchEraid = {};
  
  let raidIds = Object.keys(raidMap);
  for(let i = 0; i < raidIds.length; i++){
    let raidId = raidIds[i];
    console.log("Getting raid info for", raidId, raidMap[raidId].name);
    let retrievedInfo = await getJsonRespond(factInfo.raidUrl.replace(/<id>/g, raidId));
    if(retrievedInfo !== null) {
      searchRaid[raidId] = retrievedInfo;
    }
  }
  
  let eraidIds = Object.keys(eraidMap);
  for(let i = 0; i < eraidIds.length; i++){
    let eraidId = eraidIds[i];
    console.log("Getting eraid info for", eraidId, eraidMap[eraidId].name);
    let retrievedInfo = await getJsonRespond(factInfo.eraidUrl.replace(/<id>/g, eraidId));
    if(retrievedInfo !== null) {
      searchEraid[eraidId] = retrievedInfo;
    }
  }
  
  let studentMap = {};
  let rankMap = {};
  let timeMap = {};

  Object.keys(searchRaid).forEach(noRaid => {
    let currRaidInfo = searchRaid[noRaid];
    let raidName = raidMap[noRaid].name + " 總力";
    timeMap[currRaidInfo.trophyCutByTime.id[0]] = raidName;
    
    Object.keys(currRaidInfo.characterUsage.r).forEach(rankRange => {
      Object.keys(currRaidInfo.characterUsage.r[rankRange]).forEach(stdId => {
        let stdNm = stdInfo[stdId].Name;
        let isLimited = stdInfo[stdId].IsLimited;
        
        if(factInfo.summaryRank.includes(rankRange)) {
          let rankIndex = factInfo.summaryRank.findIndex(val => val === rankRange);
          if(!rankMap.hasOwnProperty(rankRange)) {
            rankMap[rankRange] = {};
          }
          
          if(!rankMap[rankRange].hasOwnProperty(stdId)) {
            rankMap[rankRange][stdId] = {"id": stdId, "stdNm": stdNm, "max": 0, "isLimited": isLimited, "cnt": 0};
          }
          
          let useCnt = currRaidInfo.characterUsage.r[rankRange][stdId].reduce((a, c) => a + c, 0);
          if(rankIndex !== 0) {
            let prevRank = factInfo.summaryRank[rankIndex - 1];
            if(currRaidInfo.characterUsage.r[prevRank].hasOwnProperty(stdId)){
              useCnt -= currRaidInfo.characterUsage.r[prevRank][stdId].reduce((a, c) => a + c, 0);
            }
          }
          
          if(useCnt > 0) {
            rankMap[rankRange][stdId][raidName] = useCnt;
            rankMap[rankRange][stdId].max = Math.max(rankMap[rankRange][stdId].max, useCnt);
            rankMap[rankRange][stdId].cnt++;
          }
        }
        
        
        if(!studentMap.hasOwnProperty(stdId)) {
          studentMap[stdId] = {};
        }
        
        if(!studentMap[stdId].hasOwnProperty(raidName)) {
          studentMap[stdId][raidName] = {};
        }
        
        studentMap[stdId][raidName][rankRange] = currRaidInfo.characterUsage.r[rankRange][stdId];
      });
    });
  });
  
  
  Object.keys(searchEraid).forEach(noEraid => {
    let currEraidInfo = searchEraid[noEraid];
    let eraidTime = currEraidInfo.trophyCutByTime.id[0];
    
    Object.keys(currEraidInfo.characterUsage).forEach(battleType => {
      let lastUnderIndex = battleType.lastIndexOf("_");
      let eraidName = translateTerm(battleType.substring(lastUnderIndex + 1)) + " " + eraidMap[noEraid].name + " 大決戰";
      //let eraidName = "Eraid " + noEraid + " - " + battleType.substring(lastUnderIndex + 1);
      timeMap[eraidTime + eraidName] = eraidName;
      
      Object.keys(currEraidInfo.characterUsage[battleType].r).forEach(rankRange => {
        Object.keys(currEraidInfo.characterUsage[battleType].r[rankRange]).forEach(stdId => {
          let stdNm = stdInfo[stdId].Name;
          let isLimited = stdInfo[stdId].IsLimited;
          
          if(factInfo.summaryRank.includes(rankRange)) {
            let rankIndex = factInfo.summaryRank.findIndex(val => val === rankRange);
            
            if(!rankMap.hasOwnProperty(rankRange)) {
              rankMap[rankRange] = {};
            }
            
            if(!rankMap[rankRange].hasOwnProperty(stdId)) {
              rankMap[rankRange][stdId] = {"id": stdId, "stdNm": stdNm, "max": 0, "isLimited": isLimited, "cnt": 0};
            }
            
            let useCnt = currEraidInfo.characterUsage[battleType].r[rankRange][stdId].reduce((a, c) => a + c, 0);
            if(rankIndex !== 0){
              let prevRank = factInfo.summaryRank[rankIndex - 1];
              if(currEraidInfo.characterUsage[battleType].r[prevRank].hasOwnProperty(stdId)) {
                useCnt -= currEraidInfo.characterUsage[battleType].r[prevRank][stdId].reduce((a, c) => a + c, 0);
              }
            }
            
            if(useCnt > 0) {
              rankMap[rankRange][stdId][eraidName] = useCnt;
              rankMap[rankRange][stdId].max = Math.max(rankMap[rankRange][stdId].max, useCnt);
              rankMap[rankRange][stdId].cnt++;
            }
          }
        
          if(!studentMap.hasOwnProperty(stdId)) {
            studentMap[stdId] = {};
          }
          
          if(!studentMap[stdId].hasOwnProperty(eraidName)) {
            studentMap[stdId][eraidName] = {};
          }
          
          studentMap[stdId][eraidName][rankRange] = currEraidInfo.characterUsage[battleType].r[rankRange][stdId];
        });
      });
    });
  });
  
  //console.log(studentMap);
  //console.log(rankMap);
  
  let resultWorkbook = XLSX.utils.book_new();
  
  let headerArray = ["id", "stdNm", "isLimited", "cnt", "max"];
  let raidArrayByDate = [];
  Object.keys(timeMap).sort().forEach(t => {
    headerArray.push(timeMap[t]);
    raidArrayByDate.push(timeMap[t]);
  });
  
  //console.log(timeMap);
  //console.log(headerArray);
  
  Object.keys(rankMap).forEach((rankRange, i, rankList) => {
    let dataArray = [];
    Object.keys(rankMap[rankRange]).forEach(stdId => {
      dataArray.push(rankMap[rankRange][stdId]);
    });
    let worksheet = XLSX.utils.json_to_sheet(sortStudents(dataArray), {header: headerArray});
    let sheetName = "";
    if(i === 0) {
      sheetName = "Summary - Rank " + rankRange;
    } else {
      sheetName = "Summary - Rank " + rankList[i - 1] + " to " + rankRange; 
    }
    
    XLSX.utils.book_append_sheet(resultWorkbook, worksheet, formatSheetName(sheetName));
  });

  let stdHeaderArray = [];
  factInfo.summaryRank.forEach((rank, i, rankList) => {
    for(let j = 0;  j < 10; j++){
      stdHeaderArray.push((10*i + j).toString());
    }
  });
  
  Object.keys(studentMap).forEach(stdId => {
    let dataArray = [{}, {}];
    
    factInfo.summaryRank.forEach((rank, i, rankList) => {
      dataArray[0][(10*i).toString()] =  i === 0 ? (rank + "以下") : rankList[i-1] + " - " + rank;
      dataArray[1][(10*i).toString()] = "Raid";
      dataArray[1][(10*i + 1).toString()] = "借用";
      dataArray[1][(10*i + 2).toString()] = "三星";
      dataArray[1][(10*i + 3).toString()] = "四星";
      dataArray[1][(10*i + 4).toString()] = "五星";
      dataArray[1][(10*i + 5).toString()] = "專一";
      dataArray[1][(10*i + 6).toString()] = "專二";
      dataArray[1][(10*i + 7).toString()] = "專三";
      dataArray[1][(10*i + 8).toString()] = "共計";
      dataArray[1][(10*i + 9).toString()] = "";
    });
    
    Object.keys(timeMap).sort().forEach(t => {
      let raidName = timeMap[t];
      let rowObj = {};
      
      factInfo.summaryRank.forEach((rank, i, rankList) => {
        rowObj[(10*i).toString()] = raidName;
        if(studentMap[stdId].hasOwnProperty(raidName) && studentMap[stdId][raidName].hasOwnProperty(rank)) {
          let currRankObj = studentMap[stdId][raidName][rank];
          let prevRankObj = (i === 0 ? null : studentMap[stdId][raidName][rankList[i - 1]]);
          rowObj[(10*i + 1).toString()] = prevRankObj ? currRankObj[0] - prevRankObj[0] : currRankObj[0];
          rowObj[(10*i + 2).toString()] = prevRankObj ? currRankObj[1] - prevRankObj[1] : currRankObj[1];
          rowObj[(10*i + 3).toString()] = prevRankObj ? currRankObj[2] - prevRankObj[2] : currRankObj[2];
          rowObj[(10*i + 4).toString()] = prevRankObj ? currRankObj[3] - prevRankObj[3] : currRankObj[3];
          rowObj[(10*i + 5).toString()] = prevRankObj ? currRankObj[4] - prevRankObj[4] : currRankObj[4];
          rowObj[(10*i + 6).toString()] = prevRankObj ? currRankObj[5] - prevRankObj[5] : currRankObj[5];
          rowObj[(10*i + 7).toString()] = prevRankObj ? currRankObj[6] - prevRankObj[6] : currRankObj[6];
          rowObj[(10*i + 8).toString()] = currRankObj.reduce((a, c) => a + c, 0) - (prevRankObj ? prevRankObj.reduce((a, c) => a + c, 0) : 0)
        } else {
          rowObj[(10*i + 1).toString()] = 0;
          rowObj[(10*i + 2).toString()] = 0;
          rowObj[(10*i + 3).toString()] = 0;
          rowObj[(10*i + 4).toString()] = 0;
          rowObj[(10*i + 5).toString()] = 0;
          rowObj[(10*i + 6).toString()] = 0;
          rowObj[(10*i + 7).toString()] = 0;
          rowObj[(10*i + 8).toString()] = 0;
        }
      });
      dataArray.push(rowObj);
    });
    
    let worksheet = XLSX.utils.json_to_sheet(dataArray, {header: stdHeaderArray, skipHeader:true});
    XLSX.utils.book_append_sheet(resultWorkbook, worksheet, formatSheetName(stdId + "-" + stdInfo[stdId].Name));
  });

  let wbout = XLSX.write(resultWorkbook, {bookType: 'xlsx', type: 'array' });

  let blob = new Blob([wbout], { type: 'application/octet-stream' });
  let url = URL.createObjectURL(blob);

  let a = document.createElement('a');
  a.href = url;
  a.download = 'data.xlsx';
  a.click();

  URL.revokeObjectURL(url);
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

function sortStudents(arrayStd) {
  arrayStd.sort((a, b) => {
    if (b.isLimited - a.isLimited !== 0) {
      return b.isLimited - a.isLimited;
    }

    return b.id - a.id;
  });
  
  //console.log(arrayStd);
  return arrayStd;
}

function isSameRaid(a, b) {
  if(a.RaidId !== b.RaidId)
    return false;
  
  if(a.Terrain !== b.Terrain)
    return false;
  
  if(a.hasOwnProperty("ArmorTypes")) {
    // is eraid
    a.ArmorTypes.forEach(t => {
      if(!b.ArmorTypes.includes(t))
        return false;
    });
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

function formatSheetName(s) {
  return s.replace(/[\/\\?*[\]＊]/g, '').trim().slice(0, 31);
}

console.log("呼叫 downloadInfo() 以整合總力戰/大決戰數據");

})();