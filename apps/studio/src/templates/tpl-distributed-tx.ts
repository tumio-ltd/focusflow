import type { FocusFlowDSL } from '@focusflow/dsl';

export const distributedTxTemplate: FocusFlowDSL = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: '分布式事务与可靠消息最终一致性架构',
    viewport: { width: 3840, height: 2160 },
    theme: { mode: 'dark', accent: '#f43f5e' },
    controls: { showHUDButton: true, autoplay: false, interval: 4000 },
  },
  asset: {
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=3840&q=80',
  },
  elements: {
    boxes: [
      {
        id: 'box-local-tx',
        type: 'rect',
        x: 400,
        y: 600,
        width: 750,
        height: 500,
        rx: 16,
        style: { stroke: '#38bdf8', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-cdc-debezium',
        type: 'rect',
        x: 1450,
        y: 600,
        width: 750,
        height: 500,
        rx: 16,
        style: { stroke: '#fbbf24', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-kafka-cluster',
        type: 'rect',
        x: 2500,
        y: 600,
        width: 850,
        height: 500,
        rx: 18,
        style: { stroke: '#f43f5e', strokeWidth: 5, glow: true },
      },
    ],
    paths: [
      {
        id: 'path-tx-cdc',
        from: 'box-local-tx.right',
        to: 'box-cdc-debezium.left',
        style: { stroke: '#fbbf24', strokeWidth: 4, mode: 'stream', flowSpeed: 1.8 },
      },
      {
        id: 'path-cdc-kafka',
        from: 'box-cdc-debezium.right',
        to: 'box-kafka-cluster.left',
        style: { stroke: '#f43f5e', strokeWidth: 4, mode: 'stream', flowSpeed: 2.2 },
      },
    ],
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 本地消息表与 CDC 增量捕获',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: ['box-local-tx', 'box-cdc-debezium', 'box-kafka-cluster'],
        paths: ['path-tx-cdc', 'path-cdc-kafka'],
        callouts: [
          {
            id: 'co-dtx-1',
            targetBoxId: 'box-local-tx',
            position: { left: '460px', top: '520px' },
            theme: 'blue',
            title: '业务库本地事务',
            desc: '业务表变更与 Outbox 本地消息表在同一个单库 ACID 事务中原子提交',
          },
        ],
      },
    },
    {
      id: 'scene-2',
      title: '02 Kafka 消息队列与消费者幂等保障',
      camera: { zoom: 1.8, x: 18, y: 0, duration: 1.4 },
      activeElements: {
        boxes: ['box-kafka-cluster'],
        paths: ['path-cdc-kafka'],
        callouts: [
          {
            id: 'co-dtx-2',
            targetBoxId: 'box-kafka-cluster',
            position: { left: '2560px', top: '520px' },
            theme: 'rose',
            title: 'Kafka 持久化与死信队列',
            desc: '通过唯一 MessageID 保证下游消费幂等，异常消息转入死信队列重试',
          },
        ],
      },
    },
  ],
};
