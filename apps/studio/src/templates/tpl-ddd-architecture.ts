import type { FocusFlowDSL } from '@focusflow/dsl';

export const dddArchitectureTemplate: FocusFlowDSL = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: 'DDD 领域驱动设计典型分层架构模型',
    viewport: { width: 3840, height: 2160 },
    theme: { mode: 'dark', accent: '#fbbf24' },
    controls: { showHUDButton: true, autoplay: false, interval: 4000 },
  },
  asset: {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=3840&q=80',
  },
  elements: {
    boxes: [
      {
        id: 'box-interfaces',
        type: 'rect',
        x: 600,
        y: 300,
        width: 2640,
        height: 320,
        rx: 16,
        style: { stroke: '#38bdf8', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-application',
        type: 'rect',
        x: 600,
        y: 700,
        width: 2640,
        height: 360,
        rx: 16,
        style: { stroke: '#34d399', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-domain',
        type: 'rect',
        x: 600,
        y: 1140,
        width: 2640,
        height: 400,
        rx: 18,
        style: { stroke: '#fbbf24', strokeWidth: 5, glow: true },
      },
      {
        id: 'box-infrastructure',
        type: 'rect',
        x: 600,
        y: 1620,
        width: 2640,
        height: 320,
        rx: 16,
        style: { stroke: '#c084fc', strokeWidth: 4, glow: true },
      },
    ],
    paths: [
      {
        id: 'path-app-domain',
        from: 'box-application.bottom',
        to: 'box-domain.top',
        style: { stroke: '#fbbf24', strokeWidth: 4, mode: 'stream', flowSpeed: 1.5 },
      },
    ],
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 四层经典分层总览',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: ['box-interfaces', 'box-application', 'box-domain', 'box-infrastructure'],
        paths: ['path-app-domain'],
        callouts: [
          {
            id: 'co-ddd-1',
            targetBoxId: 'box-interfaces',
            position: { left: '700px', top: '220px' },
            theme: 'blue',
            title: '用户接口层 (Interfaces)',
            desc: '负责 HTTP RESTful、GraphQL、gRPC 协议适配与 DTO 数据转换',
          },
        ],
      },
    },
    {
      id: 'scene-2',
      title: '02 领域模型核心 (Domain Core)',
      camera: { zoom: 1.9, x: 0, y: 5, duration: 1.4 },
      activeElements: {
        boxes: ['box-domain'],
        paths: [],
        callouts: [
          {
            id: 'co-ddd-2',
            targetBoxId: 'box-domain',
            position: { left: '700px', top: '1060px' },
            theme: 'amber',
            title: '领域聚合根与业务实体',
            desc: '纯 POJO 实现，零外部框架依赖，严格维护领域内高内聚业务不变量',
          },
        ],
      },
    },
  ],
};
