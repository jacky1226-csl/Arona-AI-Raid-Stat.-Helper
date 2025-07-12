# Arona AI Raid Stat. Helper 彩奈AI總力大決戰數據助手

Tampermonkey script to gather raid statistics from [Arona AI](https://arona.ai/)

then display them in another way which focus on student usage statistics across future raids in TW server in Excel format.

Tampermonkey 腳本，從 [Arona AI](https://arona.ai/) 收集總力戰/大決戰數據

然後以另一種方式顯示它們，重點關注台灣伺服器中未來總力大決戰的學生使用統計數據（以 Excel 格式）。

## Special Thanks 特別感謝

* [fiseleo](https://github.com/fiseleo) - On suggesting using data from [schaledb.com](https://schaledb.com/) to map student and raid data.
* [fiseleo](https://github.com/fiseleo) - 建議使用 [schaledb.com](https://schaledb.com/) 來對照學生和總力/大決戰情報
* [electricgoat](https://github.com/electricgoat/ba-data) - On providing JSON format for student pick-up data.
* [electricgoat](https://github.com/electricgoat/ba-data) - 提供學生日版 pick-up 資料的 JSON 版本.

## Target Audience 目標客群

* People who want to have more info to determine who to pull to be in group 1 in raids.
* 想在抽卡前得到多點資訊，以留在一檔的老師

Note that those information is not quite useful for real top players, as expect they should pull in all pools.

注意相關資訊對最先頭玩家的用途可能不大，反正他們需要全部學生都有吧？

## How to Install 如何安裝腳本

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Open the source of the script [here](https://github.com/jacky1226-csl/Arona-AI-Raid-Stat.-Helper/raw/refs/heads/main/aroneAiRaidStatHelper.js) and copy the source
3. Open Tampermonkey in your browser and click the "Add Script" tap
4. Paste the source into the script window and press on "Save" button
---

1. 安裝 [Tampermonkey](https://www.tampermonkey.net/)
2. 在[此處](https://github.com/jacky1226-csl/Arona-AI-Raid-Stat.-Helper/raw/refs/heads/main/aroneAiRaidStatHelper.js) 開啟腳本來源並複製來源
3. 在瀏覽器中開啟 Tampermonkey，然後按一下「新增腳本」按鈕
4. 將原始程式碼貼到腳本視窗中，然後按下「儲存」按鈕

## How to Use 如何使用腳本

1. Visit any page on [Arona AI](https://arona.ai/).
2. Press F12 and navigate to the "Console" tab.
3. Type `downloadInfo();` in the console and press "Enter".
4. The script will run, and the resulting Excel file will be downloaded shortly.

---

1. 造訪[Arona AI](https://arona.ai/) 任何頁面。
2. 按 F12 並導覽至「控制台」標籤。
3. 在控制台中輸入“downloadInfo();”，然後按下“Enter”。
4. 腳本將運行，生成的 Excel 檔案很快就會下載。

## How to read the downloaded Excel File 如何閱讀下載的Excel文件

The downloaded Excel file contains student usage information for future raids. It consists of two types of sheets: "Summary" and "Details of specific student".

下載的 Excel 檔案包含學生在未來總力/大決戰的使用資訊。它由兩種類型的表格組成：「摘要」和「特定學生的詳細資料」。

The summary sheet displays the usage of all students within a specific ranking range, with the following columns:

總結表顯示特定排名範圍內所有學生的使用情況，包含以下列：

| Column Name 列名稱 | Description | 描述 |
| --- | --- | --- |
| id | ID of the student | 學生編號 |
| stdNm | Name of the student | 學生名稱 | 
| isLimited | Indicates if the student is from a limited pull (not crucial) | 是否限定學生  |
| cnt | Count of raid battles in which the student is used within the given ranking range | 在指定排名內，該學生參加總力/大決戰數目 |
| max | Maximum usage count of the student across all raid battles in the given ranking range | 在指定排名內，該學生參加總力/大決戰中，最多使用次數 |
| (Raid Name) | Usage of the specific student for the raid within the given ranking range | 該學生在該場總力/大決戰中使用次數 |

Note that the usage count may be higher than the team count because a single student can be utilized twice in the same raid. This can happen when using both the original copy and a borrowed copy of the student.

注意學生使用次數可能多於排名記錄數，因為同一名學生可以以「自己的」和「借來的」同時出現於同一隻王的不同攻略隊伍中。

The names of the detail sheets are in the format "{ID of student} - {Name of student}". Therefore, you can right-click on the arrows displayed in the sheet bar to quickly locate the target sheet by the student ID, as the sheets are sorted by their names.

詳細資料表的名稱格式為「{學生 ID} - {學生姓名}」。因此，您可以右鍵單擊表單欄中顯示的箭頭，快速根據學號找到目標表單，因為表單是按名稱排序的。

Each detail sheet presents several tables that group student statistical data into ranking ranges, detailing the usage in each raid.

每個詳細資料表都提供了幾個表格，將學生統計數據分組為排名範圍，詳細說明了每次總力/大決的使用情況。

## Use Case Demo 用例演示

It is now 23 Feb 2025 and Ui (Swimsuit) will be appears in limited pull next week, and I don't have it now and want to get some idea.

今天是二月廿三，泳裝憂會在下周複刻，我現在還沒有她。

Let's focus on ranking 10k to 20k first.

來先看看一萬名到二萬名的數據吧

For 10k to 20k

| id | stdNm | isLimited | cnt | max | ... |
|---|---|---|---|---|---|
| 10073 | 憂(泳裝) | 1 | 10 | 9771 | ... |

So in the next half year, there will be 24 raid batters, and she has participants in around 10 of them. In the most used battle, she participants in around 97% of the parties in 10k to 20k ranking range.

所以在接下來半年二十四隻王中，她會比較有可能在其中的十場中出現。然後出現時最高使用率那次會有97%的隊伍中用到她。

Let me check on detail usages.

來看看詳細數據吧。

| Raid | 借用 | 三星 | 四星 | 五星 | 專一 | 專二 | 專三 | 共計 |
|---|---|---|---|---|---|---|---|---|
| 白&黑 室內 總力 | 0 | 32 | 6 | 0 | 11 | 1 | 0 | 50 |
| 彈力 佩洛洛吉拉 野外 大決戰 | 0 | 19 | 6 | 0 | 10 | 1 | 0 | 36 |
| 神秘 佩洛洛吉拉 野外 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 重甲 佩洛洛吉拉 野外 大決戰 | 118 | 6010 | 1787 | 1 | 1507 | 299 | 49 | 9771 |
| KAITEN FX Mk.0 城鎮 總力 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 彈力 黑影 城鎮 大決戰 | 0 | 4 | 1 | 0 | 2 | 0 | 0 | 7 |
| 神秘 黑影 城鎮 大決戰 | 0 | 0 | 1 | 0 | 1 | 1 | 0 | 3 |
| 輕甲 黑影 城鎮 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 葛利果 室內 總力 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 彈力 赫賽德 野外 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 神秘 赫賽德 野外 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 重甲 赫賽德 野外 大決戰 | 1 | 75 | 28 | 0 | 20 | 5 | 0 | 129 |
| 耶羅尼姆斯 城鎮 總力 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 彈力 薇娜 城鎮 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 神秘 薇娜 城鎮 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 重甲 薇娜 城鎮 大決戰 | 2 | 1203 | 607 | 1 | 395 | 109 | 19 | 2336 |
| 氣墊船 野外 總力 | 0 | 28 | 14 | 0 | 15 | 4 | 0 | 61 |
| 神秘 KAITEN FX Mk.0 城鎮 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 輕甲 KAITEN FX Mk.0 城鎮 大決戰 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 2 |
| 重甲 KAITEN FX Mk.0 城鎮 大決戰 | 82 | 2244 | 1293 | 1 | 761 | 227 | 23 | 4631 |
| Geburah 野外 總力 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 神秘 葛利果 室內 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 輕甲 葛利果 室內 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 重甲 葛利果 室內 大決戰 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

So the usage in the bottom half of group 1 is 97%, 46% and 23%, if I don't have her, I may need to borrow one in those battles, let me check the team using in those raids and see if I got slot to borrow one. Then I should start finding YouTube videos on sample parties on those battles.

所以在一檔的後半中，她使用率最高的那三場會是 97%, 46% 和 23%，如果我沒她就可能要借用了，那我就要先確保我不會缺兩隻角。接下來我就應該去 YouTube 找些相關總力/大決戰的相關影片看看是不是可以借憂解決。

While if I pull her out from the pool, it looks like in most of the case, she is have "3 star rare" in raids, so it may be ok for me to keep her there and don't need to spend resource to raise her up to "4 star" or above.

如果我打算抽的話，看上去大部份的情況都能用三星解決，升上四星以上或許不是必須。
