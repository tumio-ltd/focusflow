#!/usr/bin/env node

/**
 * ============================================================================
 * FocusFlow macOS 浏览器 CPU 占用率与资源泄漏实测采样工具 (measure-cpu.mjs)
 * ============================================================================
 * 
 * 1. 设计背景 (Background):
 *    在 FocusFlow Studio 中，常态动效重绘、TTS 语音合成以及 60FPS 屏幕录制可能
 *    引发 Chromium 渲染进程与音频底层线程高载或资源泄漏（CPU 长期 >100% 甚至 300%~400%）。
 *    本脚本基于 macOS 原生 `ps` 采样体系，免侵入、零依赖地精准追踪 Google Chrome /
 *    Chromium 渲染进程（Renderer Process）的实时 CPU 占用率与内存消耗，
 *    用于治理前建立量化基准，以及治理后验证防泄漏成效。
 * 
 * 2. 常用执行命令 (Usage):
 *    - 快速采样 5 秒:
 *        pnpm --filter @focusflow/studio test:cpu
 *        或 node apps/studio/scripts/measure-cpu.mjs 5
 *    - 针对长时间录制压测采样 30 秒:
 *        node apps/studio/scripts/measure-cpu.mjs 30
 *    - 查看完整帮助文档:
 *        node apps/studio/scripts/measure-cpu.mjs --help
 * 
 * 3. 核心输出指标 (Metrics):
 *    - PID: 操作系统级浏览器渲染进程唯一标识符
 *    - %CPU: 采样时刻该进程占用的 CPU 百分比（100% 代表单个核心完全跑满）
 *    - %MEM: 物理内存占用百分比
 *    - 统计汇总: 峰值 CPU、最低 CPU、平均 CPU 及健康状态诊断评估
 * ============================================================================
 */

import { execSync } from 'child_process';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.includes('help')) {
  console.log(`
================================================================================
📖 FocusFlow CPU 占用率实测采样工具使用说明 (measure-cpu.mjs)
================================================================================

【功能概述】
  本脚本通过 macOS 原生进程管理接口，每秒精准采样当前系统正在运行的
  Google Chrome / Chromium Renderer（渲染子进程）的 CPU 占用率与内存占用。
  用于排查 Studio 编辑态动效重绘风暴、TTS 合成泄漏以及视频录制硬件编码过载。

【命令格式】
  node apps/studio/scripts/measure-cpu.mjs [采样时长秒数]
  或
  pnpm --filter @focusflow/studio test:cpu

【参数说明】
  [采样时长秒数]  (可选) 采样持续时间（正整数，单位：秒）。默认为 5 秒。
  --help, -h       (可选) 显示本帮助说明。

【典型使用场景与对比基准】
  1. 场景一：Studio 静态编辑态（鼠标静止，观察基线空闲 CPU）
     - 执行: node apps/studio/scripts/measure-cpu.mjs 10
     - 治理前现状: 106% ~ 118% (单核满载，SVG drop-shadow 重绘风暴)
     - 治理后指标: < 5% ~ 8% (优秀受控)

  2. 场景二：全屏演播与 60FPS 客户端视频录制中 (录制动态负载)
     - 执行: 在录制启动后运行 node apps/studio/scripts/measure-cpu.mjs 15
     - 治理前现状: 300% ~ 400% (Retina 4K 无上限拉满 VP9 多核软编)
     - 治理后指标: 60% ~ 100% (1080P 封顶平稳编码)

  3. 场景三：停止录制 / 演播退出后（验证 AudioContext 与 MediaStream 硬释放）
     - 执行: 录制停止 3 秒后运行 node apps/studio/scripts/measure-cpu.mjs 10
     - 治理前现状: 100%+ 居高不下 (AudioContext 驱动线程与捕获管道泄漏)
     - 治理后指标: 瞬间回落至 < 5% (资源彻底释放，风扇停转)

【判定规则】
  • 🟢 优良 (< 15%): 处于健康空闲或低开销运行状态
  • 🟡 正常 (15% ~ 80%): 正常录制或播放运镜负载
  • 🚨 严重告警 (> 90%): 出现多核跑满、动画未暂停或硬件线程未释放泄漏
================================================================================
`);
  process.exit(0);
}

const durationSeconds = parseInt(args[0] || '5', 10);

if (isNaN(durationSeconds) || durationSeconds <= 0) {
  console.error('❌ 错误: 采样时长必须为正整数 (秒)。例如: node apps/studio/scripts/measure-cpu.mjs 10');
  process.exit(1);
}

console.log(`\n======================================================`);
console.log(`🔍 FocusFlow macOS CPU 占用率实测采样工具`);
console.log(`⏱️ 采样时长: ${durationSeconds} 秒 (每秒刷新 1 次)`);
console.log(`💡 输入 --help 可查看完整的测试场景对比指南`);
console.log(`======================================================\n`);

function sampleProcesses() {
  try {
    const raw = execSync('ps -Ao pid,pcpu,pmem,comm', { encoding: 'utf-8' });
    const lines = raw.trim().split('\n');
    const results = [];

    for (const line of lines) {
      if (line.includes('Google Chrome Helper (Renderer)') || line.includes('Chromium Helper (Renderer)')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[0];
        const pcpu = parseFloat(parts[1]) || 0;
        const pmem = parseFloat(parts[2]) || 0;
        results.push({ pid, pcpu, pmem });
      }
    }

    // 按 CPU 占用率降序排序
    results.sort((a, b) => b.pcpu - a.pcpu);
    return results;
  } catch (err) {
    console.error('采样失败:', err.message);
    return [];
  }
}

let tick = 0;
const history = new Map(); // pid -> number[]

const interval = setInterval(() => {
  tick++;
  const samples = sampleProcesses();
  const top = samples[0];

  const now = new Date().toLocaleTimeString();
  if (top) {
    console.log(`[${now}] 采样 #${tick}/${durationSeconds} ➔ 负载最高 PID: ${top.pid.padEnd(5)} | CPU: ${top.pcpu.toFixed(1).padStart(5)}% | 内存: ${top.pmem.toFixed(1).padStart(4)}%`);
    for (const s of samples.slice(0, 3)) {
      if (!history.has(s.pid)) history.set(s.pid, []);
      history.get(s.pid).push(s.pcpu);
    }
  } else {
    console.log(`[${now}] 采样 #${tick}/${durationSeconds} ➔ 未检测到活跃的 Chrome/Chromium 渲染进程`);
  }

  if (tick >= durationSeconds) {
    clearInterval(interval);
    console.log(`\n================== 📊 统计汇总分析 ==================`);
    if (history.size === 0) {
      console.log('未收集到有效进程数据。');
    } else {
      for (const [pid, records] of history.entries()) {
        const max = Math.max(...records);
        const min = Math.min(...records);
        const avg = records.reduce((a, b) => a + b, 0) / records.length;
        console.log(`PID ${pid}:`);
        console.log(`  - 峰值 CPU: ${max.toFixed(1)}%`);
        console.log(`  - 最低 CPU: ${min.toFixed(1)}%`);
        console.log(`  - 平均 CPU: ${avg.toFixed(1)}%`);
        if (avg > 90) {
          console.log(`  🚨 严重告警: 该进程处于极高满载状态 (>90% CPU)，存在严重的动效重绘或音频线程泄漏！`);
        } else if (avg < 15) {
          console.log(`  🟢 状态优良: 该进程处于正常/空闲状态 (<15% CPU)。`);
        } else {
          console.log(`  🟡 状态正常: 该进程处于中度运行状态 (15% ~ 90% CPU)。`);
        }
      }
    }
    console.log(`======================================================\n`);
  }
}, 1000);
