import type { FocusFlowDSL } from '@focusflow/dsl';

export const microservicesTemplate: FocusFlowDSL = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: '微服务高可用电商中台演进架构',
    viewport: { width: 3840, height: 2160 },
    theme: { mode: 'dark', accent: '#38bdf8' },
    controls: { showHUDButton: true, autoplay: false, interval: 3800 },
  },
  asset: {
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=3840&q=80',
  },
  elements: {
    boxes: [
      {
        id: 'box-gateway',
        type: 'rect',
        x: 400,
        y: 600,
        width: 600,
        height: 380,
        rx: 16,
        style: { stroke: '#38bdf8', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-order-svc',
        type: 'rect',
        x: 1400,
        y: 400,
        width: 700,
        height: 400,
        rx: 16,
        style: { stroke: '#34d399', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-stock-svc',
        type: 'rect',
        x: 1400,
        y: 1000,
        width: 700,
        height: 400,
        rx: 16,
        style: { stroke: '#fbbf24', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-seata-tx',
        type: 'rect',
        x: 2500,
        y: 700,
        width: 800,
        height: 480,
        rx: 18,
        style: { stroke: '#f43f5e', strokeWidth: 5, glow: true },
      },
    ],
    paths: [
      {
        id: 'path-gw-order',
        from: 'box-gateway.right',
        to: 'box-order-svc.left',
        style: { stroke: '#38bdf8', strokeWidth: 3, mode: 'stream', flowSpeed: 1.5 },
      },
      {
        id: 'path-order-seata',
        from: 'box-order-svc.right',
        to: 'box-seata-tx.left',
        style: { stroke: '#34d399', strokeWidth: 3, mode: 'stream', flowSpeed: 2.0 },
      },
      {
        id: 'path-stock-seata',
        from: 'box-stock-svc.right',
        to: 'box-seata-tx.left',
        style: { stroke: '#fbbf24', strokeWidth: 3, mode: 'stream', flowSpeed: 1.8 },
      },
    ],
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 微服务电商全局拓扑',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: ['box-gateway', 'box-order-svc', 'box-stock-svc', 'box-seata-tx'],
        paths: ['path-gw-order', 'path-order-seata', 'path-stock-seata'],
        callouts: [
          {
            id: 'co-1',
            targetBoxId: 'box-gateway',
            position: { left: '440px', top: '530px' },
            theme: 'blue',
            title: '微服务 API 网关',
            desc: '统一流量入口与动态限流熔断',
          },
        ],
      },
    },
    {
      id: 'scene-2',
      title: '02 订单微服务与防超卖机制',
      camera: { zoom: 1.9, x: -4, y: -6, duration: 1.4 },
      activeElements: {
        boxes: ['box-order-svc', 'box-stock-svc'],
        paths: ['path-gw-order'],
        callouts: [
          {
            id: 'co-2',
            targetBoxId: 'box-order-svc',
            position: { left: '1440px', top: '330px' },
            theme: 'green',
            title: '订单处理引擎',
            desc: '下单并发分流与分布式序列号生成',
          },
        ],
      },
    },
    {
      id: 'scene-3',
      title: '03 Seata 分布式事务一致性协调',
      camera: { zoom: 2.1, x: 26, y: 3, duration: 1.5 },
      activeElements: {
        boxes: ['box-seata-tx'],
        paths: ['path-order-seata', 'path-stock-seata'],
        callouts: [
          {
            id: 'co-3',
            targetBoxId: 'box-seata-tx',
            position: { left: '2540px', top: '630px' },
            theme: 'rose',
            title: 'Seata AT 全局事务管理器',
            desc: '两阶段提交与分布式回滚 Undo Log 机制',
          },
        ],
      },
    },
  ],
};
