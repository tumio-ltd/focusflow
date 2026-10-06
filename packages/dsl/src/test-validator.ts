// packages/dsl/src/test-validator.ts
import { validateDSL, FocusFlowDslSchema, type FocusFlowDSL } from './index.js';

function assert(desc: string, condition: boolean) {
  if (!condition) {
    console.error(`❌ FAILED: ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
  console.log(`✅ PASSED: ${desc}`);
}

export function runValidatorTests() {
  console.log("=== STARTING FOCUSFLOW DSL ZOD VALIDATOR TEST SUITE ===");

  // 1. Valid full DSL
  const validDsl: FocusFlowDSL = {
    $schema: "https://focusflow.io/schemas/dsl/v1.json",
    schemaVersion: "1.0.0",
    meta: {
      title: "FocusFlow Cloud Architecture",
      viewport: {
        width: 3840,
        height: 2160,
        aspectRatio: "16:9",
      },
      theme: {
        mode: "dark",
        bg: "#0B0F19",
        accent: "#3B82F6",
      },
      controls: {
        showControls: true,
        autoplay: false,
        interval: 3800,
        showPlayBtn: true,
        showCounter: true,
        showProgress: true,
        showHUDButton: true,
      },
    },
    asset: {
      url: "https://assets.focusflow.io/blueprints/k8s-cloud.png",
      name: "k8s-cloud.png",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      urlI18n: {
        zh: "https://assets.focusflow.io/blueprints/k8s-cloud-zh.png",
        en: "https://assets.focusflow.io/blueprints/k8s-cloud.png",
      },
    },
    elements: {
      boxes: [
        {
          id: "box-gateway",
          type: "rect",
          x: 1200,
          y: 650,
          width: 480,
          height: 240,
          rx: 8,
          ry: 8,
          style: {
            stroke: "#38BDF8",
            strokeWidth: 3,
            glow: true,
            fill: "rgba(56, 189, 248, 0.15)",
          },
        },
      ],
      paths: [
        {
          id: "path-gw-to-api",
          from: "box-gateway.right",
          to: "box-api.left",
          style: {
            stroke: "#38BDF8",
            strokeWidth: 2,
            mode: "stream",
            flowSpeed: 1.5,
            glow: true,
          },
        },
      ],
      dots: [
        {
          id: "dot-pulse-1",
          cx: 1440,
          cy: 770,
          r: 6,
          style: {
            fill: "#38BDF8",
            glow: true,
            pulse: true,
          },
        },
      ],
      images: [
        {
          id: "img-badge-k8s",
          url: "https://assets.focusflow.io/icons/k8s.svg",
          x: 1220,
          y: 670,
          width: 64,
          height: 64,
        },
      ],
    },
    scenes: [
      {
        id: "scene-01-gateway",
        title: "API 网关分流层",
        titleI18n: {
          zh: "API 网关分流层",
          en: "API Gateway Layer",
        },
        duration: 4000,
        voiceoverScript: "客户端请求首先经过全局高可用 API 网关，进行 SSL 卸载与速率限制。",
        camera: {
          zoom: 1.8,
          x: 5,
          y: -10,
          duration: 1.2,
        },
        activeElements: {
          boxes: ["box-gateway"],
          paths: ["path-gw-to-api"],
          dots: ["dot-pulse-1"],
          callouts: [
            {
              id: "callout-gw",
              targetBoxId: "box-gateway",
              position: {
                left: "35%",
                top: "20%",
              },
              title: "Envoy / Traefik",
              desc: "具备 L7 路由、WAF 防护与分布式熔断能力。",
            },
          ],
        },
      },
    ],
    audio: {
      tracks: [
        {
          id: "track-bgm",
          url: "https://assets.focusflow.io/bgm/ambient-tech.mp3",
          durationMs: 120000,
          volume: 0.35,
          isBackgroundBGM: true,
        },
      ],
      mixer: {
        masterVolume: 1.0,
        enableDucking: true,
        duckingDb: -14,
      },
    },
  };

  const fullResult = validateDSL(validDsl);
  assert("Full valid DSL passes validation", fullResult.valid === true && fullResult.errors.length === 0);
  assert("Validated data is returned", fullResult.data?.meta.title === "FocusFlow Cloud Architecture");

  // 2. Reject empty scenes
  const emptyScenesDsl = {
    ...validDsl,
    scenes: [],
  };
  const emptyResult = validateDSL(emptyScenesDsl);
  assert("Empty scenes array rejected", emptyResult.valid === false);
  assert("Error contains scenes message", emptyResult.errors.some(e => e.includes("scenes 分幕列表不能为空")));

  // 3. Reject negative box dimensions
  const negativeBoxDsl = {
    ...validDsl,
    elements: {
      ...validDsl.elements,
      boxes: [
        {
          ...validDsl.elements.boxes[0],
          width: -100, // Negative!
        },
      ],
    },
  };
  const negativeBoxResult = validateDSL(negativeBoxDsl);
  assert("Negative box width rejected", negativeBoxResult.valid === false);
  assert("fieldErrors contains elements.boxes.0.width", !!negativeBoxResult.fieldErrors?.["elements.boxes.0.width"]);

  // 4. Reject camera.zoom out of range
  const invalidZoomDsl = {
    ...validDsl,
    scenes: [
      {
        ...validDsl.scenes[0],
        camera: {
          zoom: 4.5, // Exceeds 3.0!
          x: 0,
          y: 0,
        },
      },
    ],
  };
  const zoomResult = validateDSL(invalidZoomDsl);
  assert("Camera zoom > 3.0 rejected", zoomResult.valid === false);
  assert("fieldErrors contains camera.zoom message", zoomResult.errors.some(e => e.includes("zoom 缩放倍率不能大于 3.0")));

  // 5. Reject camera.x out of range
  const invalidCamXDsl = {
    ...validDsl,
    scenes: [
      {
        ...validDsl.scenes[0],
        camera: {
          zoom: 1.5,
          x: -65, // Less than -50!
          y: 0,
        },
      },
    ],
  };
  const camXResult = validateDSL(invalidCamXDsl);
  assert("Camera x < -50 rejected", camXResult.valid === false);
  assert("fieldErrors contains camera.x error", camXResult.errors.some(e => e.includes("x 水平平移百分比不能小于 -50")));

  // 6. Reject missing asset.url
  const missingAssetDsl = {
    ...validDsl,
    asset: {
      url: "",
    },
  };
  const missingAssetResult = validateDSL(missingAssetDsl);
  assert("Empty asset.url rejected", missingAssetResult.valid === false);

  // 7. Schema exported and works directly
  const schemaParsed = FocusFlowDslSchema.safeParse(validDsl);
  assert("FocusFlowDslSchema can parse directly", schemaParsed.success === true);

  console.log("=== ALL FOCUSFLOW DSL VALIDATOR TESTS PASSED PERFECTLY ===");
}

runValidatorTests();
