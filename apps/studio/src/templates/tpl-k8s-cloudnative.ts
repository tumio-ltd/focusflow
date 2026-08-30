import type { FocusFlowDSL } from '@focusflow/dsl';

export const k8sCloudNativeTemplate: FocusFlowDSL = {
  $schema: 'https://focusflow.io/schema/v1.json',
  meta: {
    title: 'Kubernetes 云原生 GitOps 自动化流水线',
    viewport: { width: 3840, height: 2160 },
    theme: { mode: 'dark', accent: '#0ea5e9' },
    controls: { showHUDButton: true, autoplay: false, interval: 3800 },
  },
  asset: {
    url: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=3840&q=80',
  },
  elements: {
    boxes: [
      {
        id: 'box-git',
        type: 'rect',
        x: 400,
        y: 800,
        width: 600,
        height: 400,
        rx: 16,
        style: { stroke: '#f97316', strokeWidth: 4, glow: true },
      },
      {
        id: 'box-argocd',
        type: 'rect',
        x: 1400,
        y: 800,
        width: 700,
        height: 400,
        rx: 16,
        style: { stroke: '#0ea5e9', strokeWidth: 5, glow: true },
      },
      {
        id: 'box-k8s-cluster',
        type: 'rect',
        x: 2500,
        y: 600,
        width: 900,
        height: 800,
        rx: 20,
        style: { stroke: '#38bdf8', strokeWidth: 6, glow: true },
      },
    ],
    paths: [
      {
        id: 'path-git-argo',
        from: 'box-git.right',
        to: 'box-argocd.left',
        style: { stroke: '#f97316', strokeWidth: 4, mode: 'stream', flowSpeed: 2.0 },
      },
      {
        id: 'path-argo-k8s',
        from: 'box-argocd.right',
        to: 'box-k8s-cluster.left',
        style: { stroke: '#0ea5e9', strokeWidth: 4, mode: 'stream', flowSpeed: 2.0 },
      },
    ],
  },
  scenes: [
    {
      id: 'scene-1',
      title: '01 GitOps 持续部署全流程',
      camera: { zoom: 1.0, x: 0, y: 0, duration: 1.2 },
      activeElements: {
        boxes: ['box-git', 'box-argocd', 'box-k8s-cluster'],
        paths: ['path-git-argo', 'path-argo-k8s'],
        callouts: [
          {
            id: 'co-k8s-1',
            targetBoxId: 'box-git',
            position: { left: '440px', top: '720px' },
            theme: 'orange',
            title: 'Git 声明式配置仓库',
            desc: '单一真实事实来源 (Single Source of Truth)',
          },
        ],
      },
    },
    {
      id: 'scene-2',
      title: '02 ArgoCD 状态监听与金丝雀发布',
      camera: { zoom: 1.8, x: 15, y: 0, duration: 1.4 },
      activeElements: {
        boxes: ['box-argocd', 'box-k8s-cluster'],
        paths: ['path-argo-k8s'],
        callouts: [
          {
            id: 'co-k8s-2',
            targetBoxId: 'box-argocd',
            position: { left: '1440px', top: '720px' },
            theme: 'blue',
            title: 'ArgoCD 控制器',
            desc: '实时比对期望状态与实际运行集群状态，自动执行金丝雀渐进式发布',
          },
        ],
      },
    },
  ],
};
