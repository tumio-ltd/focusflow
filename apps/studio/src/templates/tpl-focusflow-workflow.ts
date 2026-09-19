import type { FocusFlowDSL } from '@focusflow/dsl';

export const focusflowWorkflowTemplate: FocusFlowDSL = {
  "$schema": "https://focusflow.io/schema/v1.json",
  "meta": {
    "title": "FocusFlow Living Canvas · 45s Official Feature Showcase",
    "viewport": {
      "width": 3840,
      "height": 2160,
      "aspectRatio": "16:9"
    },
    "theme": {
      "mode": "light",
      "accent": "#2563eb"
    },
    "controls": {
      "showHUDButton": true,
      "autoplay": false,
      "interval": 5000,
      "showControls": true
    }
  },
  "asset": {
    "url": "/focusflow_workflow_light_en.png",
    "urlI18n": {
      "zh": "/focusflow_workflow_light.png",
      "en": "/focusflow_workflow_light_en.png"
    }
  },
  "audio": {
    "tracks": [
      {
        "id": "track-master-1789712673330",
        "name": "🎙️ 全局分幕智能合流母带",
        "url": "/audio/focusflow-workflow-master.mp3",
        "durationMs": 90380,
        "volume": 1,
        "muted": false,
        "isOfflineTTS": false,
        "type": "voiceover",
        "markers": [
          {
            "id": "marker-scene-0",
            "timeMs": 0,
            "label": "01 The Broken Past Dilemma",
            "sceneIndex": 0
          },
          {
            "id": "marker-scene-1",
            "timeMs": 17020,
            "label": "02 The Living Future Paradigm Shift",
            "sceneIndex": 1
          },
          {
            "id": "marker-scene-2",
            "timeMs": 35400,
            "label": "03 Camera Frustum & Spatial Continuity",
            "sceneIndex": 2
          },
          {
            "id": "marker-scene-3",
            "timeMs": 52380,
            "label": "04 Living Canvas & Live Inspection",
            "sceneIndex": 3
          },
          {
            "id": "marker-scene-4",
            "timeMs": 67800,
            "label": "05 Dual Zero-SaaS Delivery, Links & Grand Finale",
            "sceneIndex": 4
          }
        ]
      }
    ]
  },
  "elements": {
    "boxes": [
      {
        "id": "box-broken-past",
        "type": "rect",
        "x": 89,
        "y": 276,
        "width": 1552,
        "height": 450,
        "rx": 28,
        "style": {
          "stroke": "#ef4444",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-living-future",
        "type": "rect",
        "x": 1681,
        "y": 273,
        "width": 2056,
        "height": 450,
        "rx": 28,
        "style": {
          "stroke": "#2563eb",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-card-01-spotlight",
        "type": "rect",
        "x": 127,
        "y": 799,
        "width": 787,
        "height": 711,
        "rx": 32,
        "style": {
          "stroke": "#2563eb",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-card-02-continuity",
        "type": "rect",
        "x": 1051,
        "y": 806,
        "width": 780,
        "height": 696,
        "rx": 32,
        "style": {
          "stroke": "#059669",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-card-03-interactive",
        "type": "rect",
        "x": 1993,
        "y": 796,
        "width": 780,
        "height": 731,
        "rx": 32,
        "style": {
          "stroke": "#d97706",
          "strokeWidth": 6,
          "glow": true
        }
      },
      {
        "id": "box-card-04-delivery",
        "type": "rect",
        "x": 2927,
        "y": 773,
        "width": 780,
        "height": 1240,
        "rx": 32,
        "style": {
          "stroke": "#7c3aed",
          "strokeWidth": 6,
          "glow": true
        }
      }
    ],
    "paths": [
      {
        "id": "path-c1-to-c2",
        "from": "box-card-01-spotlight.right",
        "to": "box-card-02-continuity.left",
        "style": {
          "stroke": "#2563eb",
          "strokeWidth": 6,
          "glow": true,
          "mode": "stream",
          "flowSpeed": 1.5
        }
      },
      {
        "id": "path-c2-to-c3",
        "from": "box-card-02-continuity.right",
        "to": "box-card-03-interactive.left",
        "style": {
          "stroke": "#059669",
          "strokeWidth": 6,
          "glow": true,
          "mode": "stream",
          "flowSpeed": 1.5
        }
      },
      {
        "id": "path-c3-to-c4",
        "from": "box-card-03-interactive.right",
        "to": "box-card-04-delivery.left",
        "style": {
          "stroke": "#d97706",
          "strokeWidth": 6,
          "glow": true,
          "mode": "stream",
          "flowSpeed": 1.5
        }
      }
    ]
  },
  "scenes": [
    {
      "id": "scene-1-broken-past",
      "title": "01 The Broken Past Dilemma",
      "titleI18n": {
        "zh": "01 传统演示的三大困境",
        "en": "01 The Broken Past Dilemma"
      },
      "duration": 17020,
      "voiceoverScript": "When presenting complex architectures, traditional slide decks break mental models, static canvases overwhelm your audience, and pre-recorded videos are unclickable dead pixels. Legacy presentations are failing engineering teams.",
      "voiceoverScriptI18n": {
        "zh": "面对百万行复杂架构，传统 PPT 翻页切片造成上下文割裂，静态白板信息过载无从聚焦，录屏更是一堆无法打断的死像素。传统技术汇报方式，正在严重阻碍高效决策。",
        "en": "When presenting complex architectures, traditional slide decks break mental models, static canvases overwhelm your audience, and pre-recorded videos are unclickable dead pixels. Legacy presentations are failing engineering teams."
      },
      "camera": {
        "zoom": 2.05,
        "x": -23.9,
        "y": -24.1,
        "duration": 1.4
      },
      "activeElements": {
        "boxes": [
          "box-broken-past"
        ],
        "paths": [],
        "callouts": [
          {
            "id": "co-broken-past",
            "position": {
              "left": "346px",
              "top": "716px"
            },
            "theme": "pink",
            "title": "The Broken Past Dilemma",
            "desc": "Discrete Slices · Zero Frustum Guidance · Dead Pixels",
            "titleI18n": {
              "zh": "传统演示的三大体验断层",
              "en": "The Broken Past Dilemma"
            },
            "descI18n": {
              "zh": "离散切片 · 缺乏视锥导播 · 录屏死像素不可互动",
              "en": "Discrete Slices · Zero Frustum Guidance · Dead Pixels"
            },
            "style": {
              "fontSize": 19,
              "titleFontSize": 21,
              "maxWidth": 580
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-workflow-master.mp3",
        "durationMs": 16520,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 17020
      }
    },
    {
      "id": "scene-2-living-future",
      "title": "02 The Living Future Paradigm Shift",
      "titleI18n": {
        "zh": "02 FocusFlow 活画布新范式",
        "en": "02 The Living Future Paradigm Shift"
      },
      "duration": 18380,
      "voiceoverScript": "FocusFlow introduces the Living Canvas paradigm — breaking free from slides and dead pixels. Combining 60fps continuous flight, millisecond-level interactive inspection, and zero SaaS lock-in to eliminate presentation friction for good.",
      "voiceoverScriptI18n": {
        "zh": "FocusFlow 全景活画布演播引擎，打破切片割裂与死像素束缚。以 60 帧连续空间运镜、毫秒级随时打断探索与零 SaaS 依赖交付，开启全新的技术演播新范式！",
        "en": "FocusFlow introduces the Living Canvas paradigm — breaking free from slides and dead pixels. Combining 60fps continuous flight, millisecond-level interactive inspection, and zero SaaS lock-in to eliminate presentation friction for good."
      },
      "camera": {
        "zoom": 1.85,
        "x": 20.6,
        "y": -18.9,
        "duration": 1.6
      },
      "activeElements": {
        "boxes": [
          "box-living-future"
        ],
        "paths": [],
        "callouts": [
          {
            "id": "co-living-future",
            "position": {
              "left": "1962px",
              "top": "766px"
            },
            "theme": "blue",
            "title": "The Living Future Paradigm",
            "desc": "60fps Continuous Flight · Live DOM Inspection · <5MB Air-Gapped",
            "titleI18n": {
              "zh": "FocusFlow 活画布破局新范式",
              "en": "The Living Future Paradigm"
            },
            "descI18n": {
              "zh": "60fps 连续运镜 · 随时打断探查 · <5MB 独立离线自闭环",
              "en": "60fps Continuous Flight · Live DOM Inspection · <5MB Air-Gapped"
            },
            "style": {
              "fontSize": 19,
              "titleFontSize": 21,
              "maxWidth": 640
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-workflow-master.mp3",
        "durationMs": 17880,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 18380
      }
    },
    {
      "id": "scene-3-frustum-and-continuity",
      "title": "03 Camera Frustum & Spatial Continuity",
      "titleI18n": {
        "zh": "03 电影级视锥取景与空间连续运镜",
        "en": "03 Camera Frustum & Spatial Continuity"
      },
      "duration": 16980,
      "voiceoverScript": "The intelligent camera frustum locks onto target subsystems within an optimal 16:9 safe boundary. Physics-based continuous flight travels seamlessly from macro architecture boundaries into microservice depths with zero page breaks.",
      "voiceoverScriptI18n": {
        "zh": "在演播中，电影级视锥取景框自动框选目标，智能计算 16:9 最佳安全视野；伴随 60 帧物理动力学推轨，从全局系统边界平滑推进至微服务深处，空间拓扑全局在胸、细节一览无余。",
        "en": "The intelligent camera frustum locks onto target subsystems within an optimal 16:9 safe boundary. Physics-based continuous flight travels seamlessly from macro architecture boundaries into microservice depths with zero page breaks."
      },
      "camera": {
        "zoom": 1.95,
        "x": -22.6,
        "y": 10,
        "duration": 1.8
      },
      "activeElements": {
        "boxes": [
          "box-card-01-spotlight",
          "box-card-02-continuity"
        ],
        "paths": [
          "path-c1-to-c2"
        ],
        "callouts": [
          {
            "id": "co-frustum-camera",
            "position": {
              "left": "662px",
              "top": "1507px"
            },
            "theme": "cyan",
            "title": "Cinematic Camera Frustum",
            "desc": "16:9 Intelligent Framing + 60fps Bezier Camera Flight",
            "titleI18n": {
              "zh": "电影级智能视锥取景",
              "en": "Cinematic Camera Frustum"
            },
            "descI18n": {
              "zh": "16:9 智能安全取景 + 60fps 贝塞尔推轨运镜",
              "en": "16:9 Intelligent Framing + 60fps Bezier Camera Flight"
            },
            "style": {
              "fontSize": 19,
              "titleFontSize": 21,
              "maxWidth": 640
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-workflow-master.mp3",
        "durationMs": 16480,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 16980
      }
    },
    {
      "id": "scene-4-living-interactive",
      "title": "04 Living Canvas & Live Inspection",
      "titleI18n": {
        "zh": "04 活画布随时暂停交互与现场答疑",
        "en": "04 Living Canvas & Live Inspection"
      },
      "duration": 15420,
      "voiceoverScript": "When stakeholders interrupt with unexpected questions, tap Spacebar to freeze playback instantly. Explore the live canvas with full DOM-level inspection, drilling down into live parameters and dependencies with total confidence.",
      "voiceoverScriptI18n": {
        "zh": "面对评委与高管的突发质询，随时按下空格键暂停演播。活画布全域任由自由拖拽探索，鼠标悬停即刻下钻探查节点实时参数与拓扑链路，现场答疑从容自如、说服力倍增！",
        "en": "When stakeholders interrupt with unexpected questions, tap Spacebar to freeze playback instantly. Explore the live canvas with full DOM-level inspection, drilling down into live parameters and dependencies with total confidence."
      },
      "camera": {
        "zoom": 2.1,
        "x": 11.9,
        "y": 7,
        "duration": 1.6
      },
      "activeElements": {
        "boxes": [
          "box-card-03-interactive"
        ],
        "paths": [
          "path-c2-to-c3"
        ],
        "callouts": [
          {
            "id": "co-pause-inspector",
            "position": {
              "left": "2021px",
              "top": "1500px"
            },
            "theme": "orange",
            "title": "Spacebar Instant Pause",
            "desc": "Pause Anytime · Full DOM-Level Live Parameter Inspection",
            "titleI18n": {
              "zh": "随时暂停 · 活画布探索",
              "en": "Spacebar Instant Pause"
            },
            "descI18n": {
              "zh": "随时打断演播 · DOM 级深潜探查参数与拓扑",
              "en": "Pause Anytime · Full DOM-Level Live Parameter Inspection"
            },
            "style": {
              "fontSize": 19,
              "titleFontSize": 21,
              "maxWidth": 620
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-workflow-master.mp3",
        "durationMs": 14920,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 15420
      }
    },
    {
      "id": "scene-5-dual-delivery-finale",
      "title": "05 Dual Zero-SaaS Delivery, Links & Grand Finale",
      "titleI18n": {
        "zh": "05 双模零依赖交付、官方链接与全景终章",
        "en": "05 Dual Zero-SaaS Delivery, Links & Grand Finale"
      },
      "duration": 22580,
      "voiceoverScript": "Zero SaaS delivery barriers: export broadcast-quality 1080P 60fps video, or pack everything into a standalone HTML file under 5 megabytes for air-gapped security. FocusFlow: bringing complex systems to life. Explore live at focusflow.tumio.site, and Star us on GitHub!",
      "voiceoverScriptI18n": {
        "zh": "交付真正零壁垒：既可一键导出 1080P 60帧高清宣传片，又能打包为小于 5MB 的离线单网页，金融与政企涉密机房即插即开。FocusFlow —— 让百万行复杂架构，鲜活演播！欢迎访问 focusflow.tumio.site，前往 GitHub 开源社区探索体验！",
        "en": "Zero SaaS delivery barriers: export broadcast-quality 1080P 60fps video, or pack everything into a standalone HTML file under 5 megabytes for air-gapped security. FocusFlow: bringing complex systems to life. Explore live at focusflow.tumio.site, and Star us on GitHub!"
      },
      "camera": {
        "zoom": 1,
        "x": 0,
        "y": 0,
        "duration": 2.2
      },
      "activeElements": {
        "boxes": [
          "box-card-04-delivery"
        ],
        "paths": [
          "path-c3-to-c4"
        ],
        "callouts": [
          {
            "id": "co-dual-delivery",
            "position": {
              "left": "1653px",
              "top": "1320px"
            },
            "theme": "purple",
            "title": "1080P MP4 + Single HTML",
            "desc": "< 5MB Standalone Bundle · Air-Gapped Offline Ready",
            "titleI18n": {
              "zh": "1080P 视频 + 单网页双模交付",
              "en": "1080P MP4 + Single HTML"
            },
            "descI18n": {
              "zh": "< 5MB 单文件自闭环 · 纯离线绝密机房即插即播",
              "en": "< 5MB Standalone Bundle · Air-Gapped Offline Ready"
            },
            "style": {
              "fontSize": 19,
              "titleFontSize": 21,
              "maxWidth": 640
            }
          },
          {
            "id": "co-finale-cta",
            "position": {
              "left": "654px",
              "top": "779px"
            },
            "theme": "blue",
            "title": "FocusFlow Studio · The Living Canvas Engine",
            "desc": "🌐 Live Website: focusflow.tumio.site  •  ⭐ GitHub: github.com/tumio-ltd/focusflow",
            "titleI18n": {
              "zh": "FocusFlow Studio 活画布演播引擎",
              "en": "FocusFlow Studio · The Living Canvas Engine"
            },
            "descI18n": {
              "zh": "🌐 官方站点: focusflow.tumio.site  •  ⭐ GitHub 开源: github.com/tumio-ltd/focusflow",
              "en": "🌐 Live Website: focusflow.tumio.site  •  ⭐ GitHub: github.com/tumio-ltd/focusflow"
            },
            "style": {
              "fontSize": 20,
              "titleFontSize": 24,
              "maxWidth": 1080
            }
          }
        ],
        "dots": [],
        "images": []
      },
      "voiceoverAudio": {
        "url": "/audio/focusflow-workflow-master.mp3",
        "durationMs": 22080,
        "voiceId": "Charon",
        "model": "gemini-3.1-flash-tts-preview",
        "adaptedDuration": 22580
      }
    }
  ]
};
