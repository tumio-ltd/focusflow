import type { FocusFlowDSL } from '@focusflow/dsl';

export const focusflowArchitectureTemplate: FocusFlowDSL = {
  "$schema": "https://focusflow.io/schema/v1.json",
  "meta": {
    "title": "FocusFlow Studio Architecture & 60fps Walkthrough",
    "viewport": {
      "width": 3840,
      "height": 2160,
      "aspectRatio": "16:9"
    },
    "theme": {
      "mode": "dark",
      "accent": "#06b6d4"
    },
    "controls": {
      "showHUDButton": true,
      "autoplay": false,
      "interval": 4200,
      "showControls": true
    }
  },
  "asset": {
    "url": "/focusflow_architecture_dark.png"
  },
  "audio": {
    "tracks": [
      {
        "id": "track-voiceover-master",
        "name": "FocusFlow Official Voiceover Walkthrough",
        "url": "/audio/focusflow-voiceover-master.mp3",
        "durationMs": 107257,
        "type": "voiceover",
        "markers": [
          {
            "id": "marker-scene-0",
            "timeMs": 0,
            "label": "01 Global Architecture & The Dilemma",
            "sceneIndex": 0
          },
          {
            "id": "marker-scene-1",
            "timeMs": 22340,
            "label": "02 Studio Workbench & Dual-Track Timeline",
            "sceneIndex": 1
          },
          {
            "id": "marker-scene-2",
            "timeMs": 36217,
            "label": "03 Real-Time Sobel CV Edge Snapping",
            "sceneIndex": 2
          },
          {
            "id": "marker-scene-3",
            "timeMs": 52837,
            "label": "04 60fps Kinematics & Bezier Flow Engine",
            "sceneIndex": 3
          },
          {
            "id": "marker-scene-4",
            "timeMs": 74257,
            "label": "05 Offline Standalone HTML & In-Browser 60fps Export",
            "sceneIndex": 4
          },
          {
            "id": "marker-scene-5",
            "timeMs": 93757,
            "label": "06 Full-Canvas Finale & Open Source",
            "sceneIndex": 5
          }
        ]
      }
    ]
  },
  "elements": {
    "boxes": [
      {
        "id": "box-card-workbench",
        "type": "rect",
        "x": 96,
        "y": 322,
        "width": 1082,
        "height": 315,
        "rx": 20,
        "style": {
          "stroke": "#f97316",
          "strokeWidth": 5,
          "glow": true
        }
      },
      {
        "id": "box-card-formula",
        "type": "rect",
        "x": 96,
        "y": 659,
        "width": 1082,
        "height": 498,
        "rx": 20,
        "style": {
          "stroke": "#fb923c",
          "strokeWidth": 5,
          "glow": true
        }
      },
      {
        "id": "box-card-sobel",
        "type": "rect",
        "x": 1276,
        "y": 317,
        "width": 1283,
        "height": 292,
        "rx": 20,
        "style": {
          "stroke": "#06b6d4",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-card-kinematics",
        "type": "rect",
        "x": 1278,
        "y": 621,
        "width": 1283,
        "height": 279,
        "rx": 20,
        "style": {
          "stroke": "#38bdf8",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-card-bezier",
        "type": "rect",
        "x": 1278,
        "y": 917,
        "width": 1283,
        "height": 262,
        "rx": 20,
        "style": {
          "stroke": "#a855f7",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-card-compiler",
        "type": "rect",
        "x": 2662,
        "y": 667,
        "width": 1081,
        "height": 218,
        "rx": 20,
        "style": {
          "stroke": "#10b981",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-card-recorder",
        "type": "rect",
        "x": 2661,
        "y": 905,
        "width": 1082,
        "height": 303,
        "rx": 20,
        "style": {
          "stroke": "#06b6d4",
          "strokeWidth": 6,
          "glow": true
        }
      }
    ],
    "paths": [
      {
        "id": "path-wb-to-sobel",
        "from": "box-card-workbench.right",
        "to": "box-card-sobel.left",
        "style": {
          "stroke": "#f97316",
          "strokeWidth": 7,
          "glow": true,
          "mode": "stream",
          "flowSpeed": 1.4
        }
      },
      {
        "id": "path-kinematics-to-compiler",
        "from": "box-card-kinematics.right",
        "to": "box-card-compiler.left",
        "style": {
          "stroke": "#10b981",
          "strokeWidth": 7,
          "glow": true,
          "mode": "stream",
          "flowSpeed": 1.6
        }
      }
    ]
  },
  "scenes": [
    {
      "id": "scene-1",
      "title": "01 Global Architecture & The Dilemma",
      "titleI18n": {
        "en": "01 Global Architecture & The Dilemma",
        "zh": "01 全局鸟瞰与架构痛点"
      },
      "duration": 22340,
      "voiceoverScript": "We have all been there: explaining complex software architectures on a massive, static 50-box diagram. Stakeholders get lost, attention fades, and slide decks just do not do justice to distributed systems. Meet FocusFlow — the open-source camera director that brings architecture diagrams to life.",
      "voiceoverScriptI18n": {
        "en": "We have all been there: explaining complex software architectures on a massive, static 50-box diagram. Stakeholders get lost, attention fades, and slide decks just do not do justice to distributed systems. Meet FocusFlow — the open-source camera director that brings architecture diagrams to life.",
        "zh": "我们都经历过这样的痛点：面对密密麻麻数十个微服务的庞大架构图，听众跟不上节奏，幻灯片难以清晰传达分布式精髓。FocusFlow — 纯前端 60fps 运镜导播引擎，让沉闷的架构图焕发生机。"
      },
      "camera": {
        "zoom": 1,
        "x": 0,
        "y": 0,
        "duration": 1.5
      },
      "activeElements": {
        "boxes": [],
        "paths": [],
        "callouts": [
          {
            "id": "co-overview",
            "position": {
              "left": "449px",
              "top": "1539px"
            },
            "theme": "pink",
            "title": "FocusFlow Studio Architecture",
            "desc": "100% Client-Side Engine · Zero-Telemetry Enterprise Privacy",
            "titleI18n": {
              "en": "FocusFlow Studio Architecture",
              "zh": "FocusFlow 架构全景"
            },
            "descI18n": {
              "en": "100% Client-Side Engine · Zero-Telemetry Enterprise Privacy",
              "zh": "100% 浏览器端执行 · 零遥测企业级绝对隐私"
            },
            "style": {
              "fontSize": 20,
              "titleFontSize": 22,
              "maxWidth": 800
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-voiceover-master.mp3",
        "durationMs": 21840,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 22340
      }
    },
    {
      "id": "scene-2",
      "title": "02 Studio Workbench & Dual-Track Timeline",
      "titleI18n": {
        "en": "02 Studio Workbench & Dual-Track Timeline",
        "zh": "02 工作台人机工学与空间变换"
      },
      "duration": 13877,
      "voiceoverScript": "At the heart of the Studio is a high-performance workspace designed for engineers. A dual-track timeline orchestrates camera keyframes and audio tracks simultaneously, while our sub-pixel kinematics translate gestures into silky-smooth spatial coordinates in real time.",
      "voiceoverScriptI18n": {
        "en": "At the heart of the Studio is a high-performance workspace designed for engineers. A dual-track timeline orchestrates camera keyframes and audio tracks simultaneously, while our sub-pixel kinematics translate gestures into silky-smooth spatial coordinates in real time.",
        "zh": "工作台专为工程师打造：双轨时间轴同步编排镜头关键帧与音频波形轨，亚像素动力学算法将手势实时映射为丝滑平顺的空间坐标。"
      },
      "camera": {
        "zoom": 2.1,
        "x": -25.5,
        "y": -15.8,
        "duration": 1.2
      },
      "activeElements": {
        "boxes": [
          "box-card-workbench",
          "box-card-formula"
        ],
        "paths": [
          "path-wb-to-sobel"
        ],
        "callouts": [
          {
            "id": "co-workbench",
            "targetBoxId": "box-card-workbench",
            "position": {
              "left": "1217px",
              "top": "492px"
            },
            "theme": "pink",
            "title": "Studio Workbench Anatomy",
            "desc": "Dual-Track Timeline · Sub-Pixel Coordinate Kinematics",
            "titleI18n": {
              "en": "Studio Workbench Anatomy",
              "zh": "工作台人机工学架构"
            },
            "descI18n": {
              "en": "Dual-Track Timeline · Sub-Pixel Coordinate Kinematics",
              "zh": "双轨时间轴 · 亚像素连续空间坐标变换"
            },
            "style": {
              "fontSize": 18,
              "titleFontSize": 20,
              "maxWidth": 480
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-voiceover-master.mp3",
        "durationMs": 17440,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 17940
      }
    },
    {
      "id": "scene-3",
      "title": "03 Real-Time Sobel CV Edge Snapping",
      "titleI18n": {
        "en": "03 Real-Time Sobel CV Edge Snapping",
        "zh": "03 毫秒级 Sobel 计算机视觉吸附"
      },
      "duration": 16620,
      "voiceoverScript": "Forget tedious manual alignment. FocusFlow features an in-browser Sobel convolution kernel running on offscreen canvas. Drag any boundary near your services, and it snaps effortlessly to high-contrast edges in under one millisecond.",
      "voiceoverScriptI18n": {
        "en": "Forget tedious manual alignment. FocusFlow features an in-browser Sobel convolution kernel running on offscreen canvas. Drag any boundary near your services, and it snaps effortlessly to high-contrast edges in under one millisecond.",
        "zh": "告别繁琐的手动对齐。内置离线 Canvas 运行的 Sobel 卷积核算子，拖拽边界靠近服务节点，1毫秒内瞬间磁吸贴合高对比度边缘。"
      },
      "camera": {
        "zoom": 2.5,
        "x": 0,
        "y": -22,
        "duration": 1.2
      },
      "activeElements": {
        "boxes": [
          "box-card-sobel"
        ],
        "paths": [
          "path-wb-to-sobel"
        ],
        "callouts": [
          {
            "id": "co-sobel",
            "targetBoxId": "box-card-sobel",
            "position": {
              "left": "1712px",
              "top": "555px"
            },
            "theme": "blue",
            "title": "Real-Time Sobel CV Snapping",
            "desc": "<1ms In-Browser Convolution Kernel · Auto Magnet",
            "titleI18n": {
              "en": "Real-Time Sobel CV Snapping",
              "zh": "毫秒级 Sobel 边缘吸附"
            },
            "descI18n": {
              "en": "<1ms In-Browser Convolution Kernel · Auto Magnet",
              "zh": "<1ms 离线卷积核 · 自动边界磁吸"
            },
            "style": {
              "fontSize": 18,
              "titleFontSize": 20,
              "maxWidth": 480
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-voiceover-master.mp3",
        "durationMs": 16120,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 16620
      }
    },
    {
      "id": "scene-4",
      "title": "04 60fps Kinematics & Bezier Flow Engine",
      "titleI18n": {
        "en": "04 60fps Kinematics & Bezier Flow Engine",
        "zh": "04 60fps 电影级运镜与霓虹贝塞尔流光"
      },
      "duration": 21420,
      "voiceoverScript": "Hit play, and watch your diagram become a cinematic journey. Powered by hardware-accelerated 3D affine transforms, camera motions glide at flawless sixty frames per second, while dynamic Bezier flowlines visualize asynchronous RPC traffic with vivid traveling light pulses.",
      "voiceoverScriptI18n": {
        "en": "Hit play, and watch your diagram become a cinematic journey. Powered by hardware-accelerated 3D affine transforms, camera motions glide at flawless sixty frames per second, while dynamic Bezier flowlines visualize asynchronous RPC traffic with vivid traveling light pulses.",
        "zh": "点击播放，见证架构图化为电影之旅。硬件加速 3D 仿射变换驱动 60fps 绝无掉帧的丝滑推拉，动态贝塞尔流线以流动光脉冲精准还原微服务异步链路。"
      },
      "camera": {
        "zoom": 2.3,
        "x": 0.1,
        "y": -2.6,
        "duration": 1.2
      },
      "activeElements": {
        "boxes": [
          "box-card-kinematics",
          "box-card-bezier"
        ],
        "paths": [],
        "callouts": [],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-voiceover-master.mp3",
        "durationMs": 20920,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 21420
      }
    },
    {
      "id": "scene-5",
      "title": "05 Offline Standalone HTML & In-Browser 60fps Export",
      "titleI18n": {
        "en": "05 Offline Standalone HTML & In-Browser 60fps Export",
        "zh": "05 单文件离线分发与端侧 60fps 视频导出"
      },
      "duration": 19500,
      "voiceoverScript": "Enterprise security is non-negotiable. Export your presentation as a single standalone HTML under five megabytes, or capture silky 60fps MP4 video right in your browser. Everything runs completely offline with zero backend uploads and total privacy.",
      "voiceoverScriptI18n": {
        "en": "Enterprise security is non-negotiable. Export your presentation as a single standalone HTML under five megabytes, or capture silky 60fps MP4 video right in your browser. Everything runs completely offline with zero backend uploads and total privacy.",
        "zh": "企业数据隐私不容妥协。您可以将演播打包为小于 5MB 的独立单文件 HTML，也可以直接在浏览器内录制丝滑的 60fps MP4 视频。全部纯离线端侧运行，零后端上传，绝对私密安全。"
      },
      "camera": {
        "zoom": 2.1,
        "x": 25.4,
        "y": 0.8,
        "duration": 1.2
      },
      "activeElements": {
        "boxes": [
          "box-card-compiler",
          "box-card-recorder"
        ],
        "paths": [],
        "callouts": [
          {
            "id": "co-compiler",
            "targetBoxId": "box-card-compiler",
            "position": {
              "left": "2100px",
              "top": "676px"
            },
            "theme": "green",
            "title": "100% Offline Standalone HTML",
            "desc": "AirDrop to Thumb Drive · Zero Backend Telemetry",
            "titleI18n": {
              "en": "100% Offline Standalone HTML",
              "zh": "100% 离线单文件独立运行"
            },
            "descI18n": {
              "en": "AirDrop to Thumb Drive · Zero Backend Telemetry",
              "zh": "AirDrop 隔空投送 / U 盘即插即用 · 零后端遥测"
            },
            "style": {
              "fontSize": 18,
              "titleFontSize": 20,
              "maxWidth": 480
            }
          },
          {
            "id": "co-recorder",
            "targetBoxId": "box-card-recorder",
            "position": {
              "left": "2031px",
              "top": "880px"
            },
            "theme": "blue",
            "title": "Client-Side MediaStream Recorder",
            "desc": "Hardware 60fps MP4 / WebM Export · Direct Local Download",
            "titleI18n": {
              "en": "Client-Side MediaStream Recorder",
              "zh": "客户端原生 60fps 录制引擎"
            },
            "descI18n": {
              "en": "Hardware 60fps MP4 / WebM Export · Direct Local Download",
              "zh": "硬件加速 60fps MP4/WebM 导出 · 本地直接下载"
            },
            "style": {
              "fontSize": 18,
              "titleFontSize": 20,
              "maxWidth": 480
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-voiceover-master.mp3",
        "durationMs": 18960,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 19500
      }
    },
    {
      "id": "scene-6",
      "title": "06 Full-Canvas Finale & Open Source",
      "titleI18n": {
        "en": "06 Full-Canvas Finale & Open Source",
        "zh": "06 全景升华与 GitHub 开源首发"
      },
      "duration": 13500,
      "voiceoverScript": "FocusFlow Studio is open-source and free to use. Transform your static architecture diagrams into unforgettable technical presentations today. Check out the live demo, and star us on GitHub.",
      "voiceoverScriptI18n": {
        "en": "FocusFlow Studio is open-source and free to use. Transform your static architecture diagrams into unforgettable technical presentations today. Check out the live demo, and star us on GitHub.",
        "zh": "FocusFlow 100% 完全开源免费。立即让您的静态架构图化为震撼的电影级演播。访问在线 Demo 体验，并在 GitHub 上为我们点亮 Star！"
      },
      "camera": {
        "zoom": 1,
        "x": 0,
        "y": 0,
        "duration": 1.5
      },
      "activeElements": {
        "boxes": [
          "box-card-workbench",
          "box-card-sobel",
          "box-card-kinematics",
          "box-card-compiler",
          "box-card-recorder"
        ],
        "paths": [
          "path-wb-to-sobel",
          "path-kinematics-to-compiler"
        ],
        "callouts": [
          {
            "id": "co-finale",
            "position": {
              "left": "841px",
              "top": "1500px"
            },
            "theme": "blue",
            "title": "FocusFlow v1.0 — Open Source on GitHub",
            "desc": "github.com/tumio-ltd/focusflow · focusflow.tumio.site",
            "titleI18n": {
              "en": "FocusFlow v1.0 — Open Source on GitHub",
              "zh": "FocusFlow v1.0 — GitHub 开源首发"
            },
            "descI18n": {
              "en": "github.com/tumio-ltd/focusflow · focusflow.tumio.site",
              "zh": "github.com/tumio-ltd/focusflow · focusflow.tumio.site"
            },
            "style": {
              "fontSize": 20,
              "titleFontSize": 22,
              "maxWidth": 800
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-voiceover-master.mp3",
        "durationMs": 12200,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 13500
      }
    }
  ]
};
