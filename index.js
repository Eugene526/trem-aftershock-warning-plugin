const { ipcRenderer } = require("electron");
const path = require('path');
const appPath = path.dirname(process.execPath);
const isDev = process.defaultApp || /[\/\\]electron[\/\\]/.test(process.execPath);
const utils = isDev ? require(path.join(appPath, '../../../src/js/index/utils/utils.js')) : require(path.join(appPath, './resources/app/src/js/index/utils/utils.js'));
console.log(`${appPath}`)
class Plugin {
  #ctx;
  #config;
  speakTTS;

  constructor(ctx) {
    this.#ctx = ctx;
    this.#config = null;
    this.speakTTS = null;
  }

  init() {
    if(TREM && TREM.variable.speech) this.speakTTS = TREM.variable.speech;
    
    const focusButton = document.querySelector("#focus");
    if (focusButton) {
      const button = document.createElement("div");
      button.id = "warning_button";
      button.className = "nav-bar-location";
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="20px" width="20px" viewBox="0 0 20 20" fill="none" stroke="#e8eaed" stroke-width="2">
          <path d="M0,10 L4,8 L8,12 L12,6 L16,11 L20,10"/>
        </svg>
      `;
      focusButton.insertAdjacentElement("afterend", button);
      this.addClickEvent();
    }
  }

  addClickEvent() {
    const { info } = this.#ctx;
    const button = document.querySelector("#warning_button");
    if (button) {
      button.addEventListener("click", () => {
        ipcRenderer.send("open-plugin-window", {
          pluginId: "aftershock-warning",
          htmlPath: `${info.pluginDir}/aftershock-warning/web/index.html`,
          options: {
            width          : 886,
            height         : 673,
            minWidth       : 886,
            minHeight      : 673,
            frame          : true,
            maximized      : true,
            webPreferences : {
              nodeIntegration  : true,
            },
            title: "餘震預警控制面板",
          },
        });
      });
    }
  }

  setVoice() {
  const enabledPlugins = localStorage.getItem('enabled-plugins');
    if (this.speakTTS) {
    if (enabledPlugins) {
      const Json = JSON.parse(enabledPlugins);
      Json.forEach((item)=>{
        if(item == "disable-tts") {
        logger.warn('擴充衝突!請先停用 disable-tts以繼續使用此插件');
        
        }
      })
    } else {
      this.speakTTS.setLanguage('zh-TW');
      this.speakTTS.setRate(1);
    }
    }
  }

  onLoad() {
    this.init();
    this.setVoice();
    
    const { TREM, logger } = this.#ctx;

    const event = (event, callback) => TREM.variable.events.on(event, callback);
    
    event("ReportRelease", (ans) => {
      try {
    console.log(TREM.variable);
        let magnitude = utils.intensity_list[ans.data.eq.mag];

  
        if (!magnitude) {
          magnitude = "未知";
        }

        if (magnitude !== "未知" && magnitude >= 3.0) {
          TREM.constant.AUDIO.REPORT.play();
          const warningText = `注意！剛剛發生一起規模 ${magnitude} 地震，未來數天內可能發生較大餘震，請民眾注意安全！`;
          logger.warn(warningText);
          this.speakTTS.speak({ text: warningText });
        }
      } catch (error) {
        logger.info("Error: ", error);
        this.speakTTS.speak({ text: "發生錯誤，無法處理地震資料。" }); 
      }
    });
  }
}

module.exports = Plugin;
