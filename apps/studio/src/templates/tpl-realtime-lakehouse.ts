import type { FocusFlowDSL } from '@focusflow/dsl';

export const realtimeLakehouseTemplate: FocusFlowDSL = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: '实时流批一体湖仓与智能分析拓扑',
    viewport: {
      width: 3840,
      height: 2160,
      aspectRatio: '16:9',
    },
    theme: {
      mode: 'dark',
      accent: '#34d399',
    },
    controls: {
      showHUDButton: true,
      autoplay: false,
      interval: 4000,
      showControls: false,
    },
  },
  asset: {
    url: './templates/realtime-lakehouse.svg',
  },
  elements: {
    boxes: [
      // ROW 1: 上游业务源、数据资产治理与实时消费
      {
        id: 'box-upstream-sources',
        type: 'rect',
        x: 300,
        y: 240,
        width: 650,
        height: 180,
        rx: 16,
        style: {
          stroke: '#38bdf8',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-data-governance',
        type: 'rect',
        x: 1200,
        y: 240,
        width: 750,
        height: 120,
        rx: 14,
        style: {
          stroke: '#34d399',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-realtime-bi',
        type: 'rect',
        x: 2150,
        y: 240,
        width: 1550,
        height: 120,
        rx: 14,
        style: {
          stroke: '#818cf8',
          strokeWidth: 2,
          glow: false,
        },
      },

      // ROW 2: 核心流批计算四大阶段 (Core 4 Stages)
      {
        id: 'box-cdc-ingest',
        type: 'rect',
        x: 300,
        y: 600,
        width: 650,
        height: 460,
        rx: 16,
        style: {
          stroke: '#38bdf8',
          strokeWidth: 4,
          glow: true,
        },
      },
      {
        id: 'box-kafka-bus',
        type: 'rect',
        x: 1200,
        y: 600,
        width: 750,
        height: 460,
        rx: 16,
        style: {
          stroke: '#34d399',
          strokeWidth: 4,
          glow: true,
        },
      },
      {
        id: 'box-flink-engine',
        type: 'rect',
        x: 2150,
        y: 600,
        width: 700,
        height: 460,
        rx: 16,
        style: {
          stroke: '#fbbf24',
          strokeWidth: 4,
          glow: true,
        },
      },
      {
        id: 'box-lakehouse-olap',
        type: 'rect',
        x: 3050,
        y: 600,
        width: 650,
        height: 460,
        rx: 16,
        style: {
          stroke: '#818cf8',
          strokeWidth: 4,
          glow: true,
        },
      },

      // ROW 3: 对象存储持久化、AI 特征库与跨机房双活
      {
        id: 'box-parquet-storage',
        type: 'rect',
        x: 300,
        y: 1180,
        width: 1100,
        height: 240,
        rx: 16,
        style: {
          stroke: '#38bdf8',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-feature-store',
        type: 'rect',
        x: 1500,
        y: 1180,
        width: 1150,
        height: 240,
        rx: 16,
        style: {
          stroke: '#fbbf24',
          strokeWidth: 2,
          glow: false,
        },
      },
      {
        id: 'box-geo-disaster',
        type: 'rect',
        x: 2750,
        y: 1180,
        width: 950,
        height: 240,
        rx: 16,
        style: {
          stroke: '#818cf8',
          strokeWidth: 2,
          glow: false,
        },
      },
    ],
    paths: [
      {
        id: 'path-sources-to-cdc',
        from: 'box-upstream-sources.bottom',
        to: 'box-cdc-ingest.top',
        style: {
          stroke: '#38bdf8',
          strokeWidth: 3,
          mode: 'draw',
          flowSpeed: 1.5,
        },
      },
      {
        id: 'path-cdc-to-kafka',
        from: 'box-cdc-ingest.right',
        to: 'box-kafka-bus.left',
        style: {
          stroke: '#34d399',
          strokeWidth: 4,
          mode: 'draw',
          flowSpeed: 2.0,
        },
      },
      {
        id: 'path-kafka-to-flink',
        from: 'box-kafka-bus.right',
        to: 'box-flink-engine.left',
        style: {
          stroke: '#fbbf24',
          strokeWidth: 4,
          mode: 'draw',
          flowSpeed: 2.2,
        },
      },
      {
        id: 'path-flink-to-lakehouse',
        from: 'box-flink-engine.right',
        to: 'box-lakehouse-olap.left',
        style: {
          stroke: '#818cf8',
          strokeWidth: 4,
          mode: 'draw',
          flowSpeed: 2.0,
        },
      },
      {
        id: 'path-flink-to-bi',
        from: 'box-flink-engine.top',
        to: 'box-realtime-bi.bottom',
        style: {
          stroke: '#fbbf24',
          strokeWidth: 3,
          mode: 'draw',
          flowSpeed: 1.8,
        },
      },
      {
        id: 'path-lakehouse-to-storage',
        from: 'box-lakehouse-olap.bottom',
        to: 'box-parquet-storage.top',
        style: {
          stroke: '#818cf8',
          strokeWidth: 3,
          mode: 'draw',
          flowSpeed: 1.6,
        },
      },
    ],
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 实时流批一体湖仓全链路拓扑总览',
      titleI18n: {
        zh: '01 实时流批一体湖仓全链路拓扑总览',
        en: '01 Global Lakehouse Pipeline Overview',
      },
      duration: 17000,
      voiceoverScript:
        '欢迎体验 FocusFlow 实时流批一体湖仓与智能分析拓扑。本系统涵盖无锁 CDC 增量采集、Kafka KRaft 事务事件总线、Flink 状态化双流计算，以及 Iceberg ACID 湖仓与 ClickHouse 秒级 OLAP 分析闭环。',
      voiceoverScriptI18n: {
        zh: '欢迎体验 FocusFlow 实时流批一体湖仓与智能分析拓扑。本系统涵盖无锁 CDC 增量采集、Kafka KRaft 事务事件总线、Flink 状态化双流计算，以及 Iceberg ACID 湖仓与 ClickHouse 秒级 OLAP 分析闭环。',
        en: 'Welcome to the FocusFlow Real-Time Lakehouse and Stream-Batch Computing Topology. This architecture unifies non-locking CDC ingestion, Kafka KRaft event buffering, Flink stateful stream joins, and Apache Iceberg ACID lakehouse with ClickHouse OLAP analytics.',
      },
      camera: {
        zoom: 1,
        x: 0,
        y: 0,
        duration: 1.2,
      },
      activeElements: {
        boxes: [
          'box-upstream-sources',
          'box-data-governance',
          'box-realtime-bi',
          'box-cdc-ingest',
          'box-kafka-bus',
          'box-flink-engine',
          'box-lakehouse-olap',
          'box-parquet-storage',
          'box-feature-store',
          'box-geo-disaster',
        ],
        paths: [],
        callouts: [
          {
            id: 'co-lh-overview',
            targetBoxId: 'box-kafka-bus',
            position: {
              left: '1200px',
              top: '1080px',
            },
            theme: 'green',
            title: 'Real-Time Stream-Lakehouse Hub',
            desc: 'Sub-850ms end-to-end lag, 280k evt/s throughput with sub-120ms OLAP on 100B+ rows',
            titleI18n: {
              zh: '实时流批一体湖仓枢纽',
              en: 'Real-Time Stream-Lakehouse Hub',
            },
            descI18n: {
              zh: '端到端延迟 < 850ms，支撑 28 万事件/秒吞吐与百亿行秒级 OLAP',
              en: 'Sub-850ms end-to-end lag, 280k evt/s throughput with sub-120ms OLAP on 100B+ rows',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
        ],
      },
    },
    {
      id: 'scene-2',
      title: '02 CDC 增量抽取与 Kafka KRaft 削峰总线',
      titleI18n: {
        zh: '02 CDC 增量抽取与 Kafka KRaft 削峰总线',
        en: '02 Non-Locking CDC & Kafka KRaft Bus',
      },
      duration: 19000,
      voiceoverScript:
        'Debezium 直接解析 MySQL Binlog 与 Postgres WAL 日志，对生产库零锁竞争；通过 Confluent Schema 校验保障向后兼容演进。数据以每秒 28 万事件注入 Kafka KRaft 分布式总线，利用两阶段幂等生产彻底杜绝重复与乱序。',
      voiceoverScriptI18n: {
        zh: 'Debezium 直接解析 MySQL Binlog 与 Postgres WAL 日志，对生产库零锁竞争；通过 Confluent Schema 校验保障向后兼容演进。数据以每秒 28 万事件注入 Kafka KRaft 分布式总线，利用两阶段幂等生产彻底杜绝重复与乱序。',
        en: 'Debezium mines MySQL Binlog and Postgres WAL with zero table locks, ensuring schema backward compatibility. Streams are ingested at 280,000 events/sec into Kafka KRaft, leveraging idempotent 2PC production to eliminate duplicate and out-of-order writes.',
      },
      camera: {
        zoom: 1.85,
        x: -22,
        y: -4,
        duration: 1.4,
      },
      activeElements: {
        boxes: ['box-cdc-ingest', 'box-kafka-bus', 'box-upstream-sources'],
        paths: ['path-sources-to-cdc', 'path-cdc-to-kafka'],
        callouts: [
          {
            id: 'co-cdc-ingest',
            targetBoxId: 'box-cdc-ingest',
            position: {
              left: '260px',
              top: '1080px',
            },
            theme: 'blue',
            title: 'Non-Locking CDC (Debezium)',
            desc: 'Zero-lock Binlog mining with Avro schema registry and sub-8ms harvest lag',
            titleI18n: {
              zh: '无锁日志增量捕获 (Debezium)',
              en: 'Non-Locking CDC (Debezium)',
            },
            descI18n: {
              zh: 'MySQL/PG WAL 底层流式日志抽取，Schema 演进一致性，捕获延迟 < 8ms',
              en: 'Zero-lock Binlog mining with Avro schema registry and sub-8ms harvest lag',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 420,
            },
          },
          {
            id: 'co-kafka-kraft',
            targetBoxId: 'box-kafka-bus',
            position: {
              left: '1180px',
              top: '1080px',
            },
            theme: 'green',
            title: 'Kafka 3.7 KRaft Event Bus',
            desc: 'KRaft metadata quorum without ZooKeeper; EOS 2PC guarantees exactly-once delivery',
            titleI18n: {
              zh: 'Kafka 3.7 KRaft 事务削峰',
              en: 'Kafka 3.7 KRaft Event Bus',
            },
            descI18n: {
              zh: '去 ZooKeeper 轻量自仲裁，EOS 幂等生产杜绝乱序，8.5 GB/s 带宽吞吐',
              en: 'KRaft metadata quorum without ZooKeeper; EOS 2PC guarantees exactly-once delivery',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
        ],
      },
    },
    {
      id: 'scene-3',
      title: '03 Flink 状态化双流 Join 与 CEP 规则引擎',
      titleI18n: {
        zh: '03 Flink 状态化双流 Join 与 CEP 规则引擎',
        en: '03 Stateful Stream Join & Flink CEP',
      },
      duration: 19500,
      voiceoverScript:
        'Flink 1.19 基于 RocksDB 增量检查点管理 TB 级分布式状态；通过事件时间 Watermark 容忍 5 秒乱序延迟，在正负 15 分钟窗口内实现订单与支付流的高性能 Temporal Join，端到端处理延迟低于 12 毫秒。',
      voiceoverScriptI18n: {
        zh: 'Flink 1.19 基于 RocksDB 增量检查点管理 TB 级分布式状态；通过事件时间 Watermark 容忍 5 秒乱序延迟，在正负 15 分钟窗口内实现订单与支付流的高性能 Temporal Join，端到端处理延迟低于 12 毫秒。',
        en: 'Powered by RocksDB incremental checkpoints, Flink 1.19 manages terabyte-scale distributed states. Event-time watermarks handle 5-second lateness while executing temporal joins across order and payment streams within ±15-minute windows in under 12 milliseconds.',
      },
      camera: {
        zoom: 1.85,
        x: 8,
        y: -4,
        duration: 1.4,
      },
      activeElements: {
        boxes: ['box-flink-engine'],
        paths: ['path-kafka-to-flink'],
        callouts: [
          {
            id: 'co-flink-rocksdb',
            targetBoxId: 'box-flink-engine',
            position: {
              left: '2120px',
              top: '1080px',
            },
            theme: 'amber',
            title: 'RocksDB Stateful Dual-Stream Join',
            desc: 'Handles 1.2M records/sec; aligns order and payment streams within ±15min window',
            titleI18n: {
              zh: 'RocksDB 增量状态化双流 Join',
              en: 'RocksDB Stateful Dual-Stream Join',
            },
            descI18n: {
              zh: '处理每秒 120 万事件，±15 分钟时间窗口内订单与支付流严格对齐',
              en: 'Handles 1.2M records/sec; aligns order and payment streams within ±15min window',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
          {
            id: 'co-flink-cep',
            targetBoxId: 'box-flink-engine',
            position: {
              left: '2120px',
              top: '480px',
            },
            theme: 'amber',
            title: 'Flink CEP Real-Time Rule Engine',
            desc: 'Sub-second fraud detection, pattern matching & anomaly transaction triggers',
            titleI18n: {
              zh: 'CEP 复杂事件处理规则引擎',
              en: 'Flink CEP Real-Time Rule Engine',
            },
            descI18n: {
              zh: '毫秒级风控特征识别与异常订单拦截，实时反洗钱与套现检测',
              en: 'Sub-second fraud detection, pattern matching & anomaly transaction triggers',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 430,
            },
          },
        ],
      },
    },
    {
      id: 'scene-4',
      title: '04 Iceberg ACID 湖仓与 ClickHouse 秒级 OLAP',
      titleI18n: {
        zh: '04 Iceberg ACID 湖仓与 ClickHouse 秒级 OLAP',
        en: '04 Iceberg ACID Lakehouse & ClickHouse OLAP',
      },
      duration: 20000,
      voiceoverScript:
        '数据实时写入 Apache Iceberg V2 格式，基于 Equality Deletes 支持高频行级更新与时间旅行回溯；后台自动触发 Parquet 小文件压缩；上层由 ClickHouse 向量化引擎驱动，支撑百亿行宽表在 120 毫秒内完成复杂聚合分析。',
      voiceoverScriptI18n: {
        zh: '数据实时写入 Apache Iceberg V2 格式，基于 Equality Deletes 支持高频行级更新与时间旅行回溯；后台自动触发 Parquet 小文件压缩；上层由 ClickHouse 向量化引擎驱动，支撑百亿行宽表在 120 毫秒内完成复杂聚合分析。',
        en: 'Data streams into Apache Iceberg V2 with equality deletes, supporting high-frequency row-level upserts and time-travel rollbacks. Automated background Parquet compaction pairs with ClickHouse SIMD vectorization to execute complex aggregations on 100B+ rows in sub-120ms.',
      },
      camera: {
        zoom: 1.85,
        x: 28,
        y: -4,
        duration: 1.4,
      },
      activeElements: {
        boxes: ['box-lakehouse-olap', 'box-realtime-bi'],
        paths: ['path-flink-to-lakehouse', 'path-flink-to-bi'],
        callouts: [
          {
            id: 'co-iceberg-v2',
            targetBoxId: 'box-lakehouse-olap',
            position: {
              left: '3020px',
              top: '1080px',
            },
            theme: 'purple',
            title: 'Iceberg V2 Row Upsert & Time-Travel',
            desc: 'Equality deletes for row updates; automated background 512MB Parquet compaction',
            titleI18n: {
              zh: 'Iceberg V2 行级 Upsert 与时间旅行',
              en: 'Iceberg V2 Row Upsert & Time-Travel',
            },
            descI18n: {
              zh: 'Equality Deletes 实时更新合并，自动触发 512MB Parquet 文件压缩',
              en: 'Equality deletes for row updates; automated background 512MB Parquet compaction',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
          {
            id: 'co-clickhouse-olap',
            targetBoxId: 'box-lakehouse-olap',
            position: {
              left: '3020px',
              top: '480px',
            },
            theme: 'purple',
            title: 'ClickHouse SIMD Columnar Analytics',
            desc: 'Sub-88ms P90 latency on 100B+ rows multi-dimensional aggregations for live BI',
            titleI18n: {
              zh: 'ClickHouse SIMD 向量化加速',
              en: 'ClickHouse SIMD Columnar Analytics',
            },
            descI18n: {
              zh: '百亿行宽表复杂多维聚合 P90 延迟低至 88ms，直连大屏与实时 BI',
              en: 'Sub-88ms P90 latency on 100B+ rows multi-dimensional aggregations for live BI',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 430,
            },
          },
        ],
      },
    },
    {
      id: 'scene-5',
      title: '05 Nessie 资产版本治理、AI 特征库与跨机房双活',
      titleI18n: {
        zh: '05 Nessie 资产版本治理、AI 特征库与跨机房双活',
        en: '05 Nessie Governance, Feature Store & Geo-DR',
      },
      duration: 19500,
      voiceoverScript:
        'Project Nessie 为 Iceberg 湖仓引入 Git 式分支与零拷贝克隆治理；底层通过 Feast 实时同步在线特征与训练集，并由 MirrorMaker 2 实现多地域跨云双活同步，达成 RPO 为零、RTO 低于 30 秒的金融级高可用容灾。',
      voiceoverScriptI18n: {
        zh: 'Project Nessie 为 Iceberg 湖仓引入 Git 式分支与零拷贝克隆治理；底层通过 Feast 实时同步在线特征与训练集，并由 MirrorMaker 2 实现多地域跨云双活同步，达成 RPO 为零、RTO 低于 30 秒的金融级高可用容灾。',
        en: 'Project Nessie enables Git-like branching and zero-copy cloning for the lakehouse. Concurrently, Feast serves real-time ML features from Redis and historical datasets, while MirrorMaker 2 ensures multi-region active-active synchronization with zero RPO and sub-30s RTO.',
      },
      camera: {
        zoom: 1.75,
        x: 0,
        y: 22,
        duration: 1.5,
      },
      activeElements: {
        boxes: [
          'box-data-governance',
          'box-parquet-storage',
          'box-feature-store',
          'box-geo-disaster',
        ],
        paths: ['path-lakehouse-to-storage'],
        callouts: [
          {
            id: 'co-nessie-gov',
            targetBoxId: 'box-data-governance',
            position: {
              left: '1200px',
              top: '480px',
            },
            theme: 'green',
            title: 'Nessie Git-for-Data & Lineage',
            desc: 'Zero-copy clone enables isolated data experiments; OpenLineage automated provenance',
            titleI18n: {
              zh: 'Nessie Git 式分支与数据血缘',
              en: 'Nessie Git-for-Data & Lineage',
            },
            descI18n: {
              zh: 'Zero-Copy Clone 支持生产数据安全实验，OpenLineage 自动血缘审计',
              en: 'Zero-copy clone enables isolated data experiments; OpenLineage automated provenance',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
          {
            id: 'co-geo-dr',
            targetBoxId: 'box-geo-disaster',
            position: {
              left: '2720px',
              top: '1440px',
            },
            theme: 'purple',
            title: 'MirrorMaker 2 Active-Active Geo-DR',
            desc: 'Zero offset divergence replication with RPO=0 and sub-30s RTO disaster recovery SLA',
            titleI18n: {
              zh: 'MirrorMaker 2 跨地域双活容灾',
              en: 'MirrorMaker 2 Active-Active Geo-DR',
            },
            descI18n: {
              zh: '零 Offset 偏差同步，达成 RPO = 0、RTO < 30 秒的金融级灾备',
              en: 'Zero offset divergence replication with RPO=0 and sub-30s RTO disaster recovery SLA',
            },
            style: {
              fontSize: 19,
              titleFontSize: 18,
              maxWidth: 440,
            },
          },
        ],
      },
    },
  ],
};
