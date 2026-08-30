import type { FocusFlowDSL } from '@focusflow/dsl';

export const hotelPmsTemplate: FocusFlowDSL = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: 'LuxeHMS 酒店 PMS 房态与高并发预订核心架构 (经典示例升级版)',
    viewport: { width: 5120, height: 2880 },
    theme: {
      mode: 'dark',
      accent: '#38bdf8',
      bg: '#0a0e17',
    },
    controls: {
      showPlayBtn: true,
      showCounter: true,
      showProgress: true,
      showHUDButton: true,
      autoplay: false,
      interval: 4200,
    },
  },
  asset: {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=5120&q=85',
  },
  elements: {
    boxes: [
      {
        id: 'box-nginx',
        type: 'rect',
        x: 420,
        y: 620,
        width: 820,
        height: 480,
        rx: 18,
        style: { stroke: '#38bdf8', strokeWidth: 5, glow: true },
      },
      {
        id: 'box-nestjs-core',
        type: 'rect',
        x: 1620,
        y: 540,
        width: 1420,
        height: 680,
        rx: 20,
        style: { stroke: '#f472b6', strokeWidth: 6, glow: true },
      },
      {
        id: 'box-redis-locks',
        type: 'rect',
        x: 3620,
        y: 460,
        width: 1180,
        height: 380,
        rx: 18,
        style: { stroke: '#fbbf24', strokeWidth: 5, glow: true },
      },
      {
        id: 'box-postgres-tx',
        type: 'rect',
        x: 3620,
        y: 920,
        width: 1180,
        height: 440,
        rx: 18,
        style: { stroke: '#34d399', strokeWidth: 6, glow: true },
      },
    ],
    paths: [
      {
        id: 'path-gateway-core',
        from: 'box-nginx.right',
        to: 'box-nestjs-core.left',
        style: { stroke: '#38bdf8', strokeWidth: 4, mode: 'stream', flowSpeed: 1.8 },
      },
      {
        id: 'path-core-redis',
        from: 'box-nestjs-core.right',
        to: 'box-redis-locks.left',
        style: { stroke: '#fbbf24', strokeWidth: 4, mode: 'stream', flowSpeed: 2.2 },
      },
      {
        id: 'path-core-pg',
        from: 'box-nestjs-core.right',
        to: 'box-postgres-tx.left',
        style: { stroke: '#34d399', strokeWidth: 4, mode: 'stream', flowSpeed: 1.5 },
      },
    ],
    dots: [],
    images: [
      {
        id: 'img-tape-chart',
        url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=3520&q=80',
        x: 800,
        y: 400,
        width: 3520,
        height: 1980,
        style: {
          borderRadius: 24,
          boxShadow: true,
          border: '3px solid rgba(56, 189, 248, 0.7)',
          animation: 'zoom-fade',
        },
      },
    ],
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 LuxeHMS 酒店房态全拓扑总览',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: ['box-nginx', 'box-nestjs-core', 'box-redis-locks', 'box-postgres-tx'],
        paths: ['path-gateway-core', 'path-core-redis', 'path-core-pg'],
        callouts: [
          {
            id: 'callout-overview',
            targetBoxId: 'box-nginx',
            position: { left: '460px', top: '530px' },
            theme: 'blue',
            title: 'LuxeHMS 核心中枢',
            desc: '支撑单酒店 2000+ 房间秒级排房调度与 OTA 渠道防超卖一致性',
          },
        ],
      },
    },
    {
      id: 'scene-2',
      title: '02 NestJS 鉴权中心与排房调度引擎',
      camera: { zoom: 1.8, x: -10, y: 2, duration: 1.4 },
      activeElements: {
        boxes: ['box-nestjs-core'],
        paths: ['path-gateway-core'],
        callouts: [
          {
            id: 'callout-auth',
            targetBoxId: 'box-nestjs-core',
            position: { left: '1660px', top: '440px' },
            theme: 'rose',
            title: 'CASL 细粒度多租户鉴权',
            desc: '动态校验店长/前台/保洁不同角色的房态修改与锁定权限',
          },
        ],
      },
    },
    {
      id: 'scene-3',
      title: '03 Redis 房态分布式锁与高频缓存',
      camera: { zoom: 2.2, x: 30, y: -8, duration: 1.5 },
      activeElements: {
        boxes: ['box-redis-locks'],
        paths: ['path-core-redis'],
        callouts: [
          {
            id: 'callout-redis',
            targetBoxId: 'box-redis-locks',
            position: { left: '3660px', top: '380px' },
            theme: 'amber',
            title: 'Redlock 分布式防超卖',
            desc: '抢房与 OTA 订单创建时，利用毫秒级分布式锁保证房态原子锁定',
          },
        ],
      },
    },
    {
      id: 'scene-4',
      title: '04 PostgreSQL 多租户行级事务持久化',
      camera: { zoom: 2.1, x: 30, y: 12, duration: 1.5 },
      activeElements: {
        boxes: ['box-postgres-tx'],
        paths: ['path-core-pg'],
        callouts: [
          {
            id: 'callout-pg',
            targetBoxId: 'box-postgres-tx',
            position: { left: '3660px', top: '840px' },
            theme: 'green',
            title: '行级锁与多版本控制',
            desc: '通过 PostgreSQL FOR UPDATE 行级锁保障结账与账单变更的严格 ACID 事务',
          },
        ],
      },
    },
    {
      id: 'scene-5',
      title: '05 Tape Chart 房态甘特画卷深度下钻',
      camera: { zoom: 1.1, x: 0, y: 0, duration: 1.6 },
      activeElements: {
        boxes: [],
        paths: [],
        images: ['img-tape-chart'],
        callouts: [
          {
            id: 'callout-tape',
            targetBoxId: 'img-tape-chart',
            position: { left: '900px', top: '320px' },
            theme: 'cyan',
            title: 'Tape Chart 可视化房态画卷',
            desc: '前端 Canvas 渲染 30 天连续时间轴，支持任意房型自由拖拽排房与连通房合单',
          },
        ],
      },
    },
  ],
};
