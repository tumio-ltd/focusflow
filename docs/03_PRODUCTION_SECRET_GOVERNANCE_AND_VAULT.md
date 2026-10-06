# FocusFlow 生产环境敏感密钥安全治理与动态注入指南 (Secret Governance & KMS/Vault Guide)

> **关联规范**: [08-deployment-and-devops.md](../design/mode-b/specs/08-deployment-and-devops.md) § 4 | [10-security-hardening.md](../design/mode-b/specs/10-security-hardening.md) § 5  
> **文档编号**: `docs/03_PRODUCTION_SECRET_GOVERNANCE_AND_VAULT.md`  
> **适用对象**: 全栈研发、DevOps / SRE 运维、安全与合规审计人员  

---

## 1. 密钥安全治理核心铁律与分级原则

在企业级 B2B SaaS 架构中，敏感凭据（如数据库密码、JWT 签名私钥、微信支付商户私钥、Stripe Secret、AI 供应商 API Key）是整个系统最脆弱的攻防突破口。平台严格推行以下 **5 大生产密钥红线**：

1. **【绝对红线】严禁将任何明文生产密钥提交至 Git**：
   - 所有 `.env`、`.env.*` 文件全部强制列入 `.gitignore`（仅保留 `.env.production.example` 架构模板）；
   - CI/CD 流水线中集成 `gitleaks` / `trufflehog` 静态预检，一旦检测到高熵私钥或密码字符串，立即阻断合并。
2. **【最小权限】凭据最小化授权 (Principle of Least Privilege)**：
   - 生产数据库账号（`focusflow_app`）严禁具备 `DROP DATABASE`、`SUPERUSER` 等超管权限；
   - S3 / R2 对象存储凭据通过 IAM Policy 限制为仅对业务 Bucket 具备读写权限，禁止通配符全局访问。
3. **【动态注入】运行环境凭据动态拉取**：
   - 生产容器禁止在构建期（Build Time）烘焙任何密钥；
   - 统一在部署阶段（Deploy Time）通过 HashiCorp Vault、AWS Secrets Manager 或云厂商 KMS 动态注入。
4. **【文件权限】落盘凭据严格锁定 POSIX 600**：
   - 生产服务器上的 `.env.production` 权限必须为 `chmod 600`，属主仅限运行账号（如 `nestjs` 或 `root`），禁止其他用户读取。
5. **【证书挂载】微信支付与商户私钥禁止进入 Docker 镜像层**：
   - 商户证书（`apiclient_key.pem`）必须通过 Docker Secret 或宿主机只读 Volume (`:ro`) 挂载入容器。

---

## 2. 生产环境变量 40+ 核心矩阵字典

平台收敛出的 11 大核心维度全量生产参数定义位于根目录 [`.env.production.example`](../.env.production.example)：

| 模块大类 | 核心变量名 | 默认/范例值 | 敏感度等级 | 生产治理说明 |
| :--- | :--- | :--- | :---: | :--- |
| **全局基准** | `NODE_ENV`<br>`DOMAIN_NAME`<br>`PORT` | `production`<br>`focusflow.example.com`<br>`4000` | L1 (公开) | 定义服务运行形态、统一主域名与监听端口。 |
| **持久数据库** | `DATABASE_URL`<br>`DIRECT_URL`<br>`DB_USER`<br>`DB_PASSWORD` | `...pgbouncer:6432...?pgbouncer=true`<br>`...postgres:5432...`<br>`focusflow_app`<br>`********` | **L4 (极高危)** | • `DATABASE_URL` 走 PgBouncer 事务连接池，`connection_limit=1`；<br>• `DIRECT_URL` 直连 PG 5432，专供 `prisma migrate deploy` 获取 Advisory Lock。 |
| **缓存与队列** | `REDIS_HOST`<br>`REDIS_PORT`<br>`REDIS_PASSWORD` | `redis`<br>`6379`<br>`********` | **L3 (高危)** | 内存缓存、分布式锁与 BullMQ 渲染总线鉴权凭证。 |
| **IAM 认证** | `JWT_ACCESS_SECRET`<br>`JWT_ACCESS_SECRET_CURRENT`<br>`JWT_ACCESS_SECRET_PREVIOUS`<br>`JWT_REFRESH_SECRET` | `openssl rand -base64 64` 随机字符串 | **L4 (极高危)** | 支持零停机双密钥平滑轮换（详见 § 5）。 |
| **对象存储** | `STORAGE_DRIVER`<br>`S3_ENDPOINT`<br>`S3_ACCESS_KEY_ID`<br>`S3_SECRET_ACCESS_KEY` | `S3` / `R2`<br>`https://<ID>.r2.cloudflarestorage.com`<br>`********` | **L3 (高危)** | 4K 视频 MP4 产物与用户画布上传素材存储。 |
| **支付网关** | `WECHAT_PAY_V3_KEY`<br>`WECHAT_PAY_PRIVATE_KEY_PATH`<br>`STRIPE_SECRET_KEY`<br>`STRIPE_WEBHOOK_SECRET` | `32位密匙`<br>`/certs/apiclient_key.pem`<br>`sk_live_...`<br>`whsec_...` | **L4 (极高危)** | 资金收银核心凭据，证书文件以 Docker Secret 只读挂载。 |
| **AI 网关** | `AZURE_OPENAI_API_KEY`<br>`OPENAI_API_KEY`<br>`ELEVENLABS_API_KEY` | `********` | **L3 (高危)** | 多模型推理与语音合成 TTS API Key，按租户配额限流审计。 |
| **通知通道** | `SMTP_PASSWORD`<br>`FEISHU_WEBHOOK_URL`<br>`DINGTALK_WEBHOOK_URL` | `********` | L2 (中危) | 运营监控大屏告警机器人 Webhook 与验证码邮件。 |
| **渲染集群** | `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`<br>`CHROMIUM_PATH`<br>`RENDER_CONCURRENCY` | `true`<br>`/usr/bin/chromium`<br>`2` | L1 (公开) | 无头 Chromium 渲染并发度与环境配置。 |
| **安全守卫** | `INTERNAL_SERVICE_SECRET`<br>`CORS_ALLOWED_ORIGINS` | `********`<br>`https://focusflow.example.com` | **L3 (高危)** | 内部微服务 RPC 相互调用校验秘钥与跨域白名单。 |
| **可观测性** | `SENTRY_DSN`<br>`LOG_LEVEL`<br>`OTEL_EXPORTER_OTLP_ENDPOINT` | `https://...@sentry.io`<br>`info`<br>`http://otel-collector:4317` | L2 (中危) | 异常堆栈追踪与 OpenTelemetry 链路监控收集。 |

---

## 3. 方案一：HashiCorp Vault 动态密钥注入实践

在成熟生产运维体系中，推荐部署独立的高可用 **HashiCorp Vault** 集群管理全站机密：

```
                    ┌──────────────────────────────────────────────┐
                    │       HashiCorp Vault (KV v2 引擎)           │
                    │      secret/data/focusflow/production        │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           │ 1. CI/CD 流水线通过 AppRole
                                           │    (ROLE_ID + SECRET_ID) 认证
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │ deploy/scripts/inject-secrets-vault.sh       │
                    │   • 校验必要核心 Key 完整性                    │
                    │   • 安全拉取并组装为 .env.production          │
                    │   • 强制锁定文件属主权限为 chmod 600           │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │ docker compose -f deploy/docker-compose.prod │
                    │   • 容器以内存环境变量运行                     │
                    │   • 部署完成后立即清空磁盘中间凭证             │
                    └──────────────────────────────────────────────┘
```

### 3.1 自动化注入脚本操作

系统已内置经过生产验证的自动化拉取脚本：[`deploy/scripts/inject-secrets-vault.sh`](../deploy/scripts/inject-secrets-vault.sh)。

```bash
# 1. 设置 Vault 地址与 AppRole 凭据
export VAULT_ADDR="https://vault.internal.focusflow.io:8200"
export VAULT_ROLE_ID="7d5f0e9b-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export VAULT_SECRET_ID="a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# 2. 执行自动校验与安全注入
./deploy/scripts/inject-secrets-vault.sh .env.production

# 3. 启动生产容器编排
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## 4. 方案二：云厂商 KMS / Secrets Manager 接入

若团队深度使用 AWS 或阿里云，推荐使用原生 IAM 机器角色直连云托管秘钥管理器：

### AWS Secrets Manager 接入模式
```bash
# 无需任何静态 Token，通过 EC2 Instance Profile (IAM Role) 授权拉取
aws secretsmanager get-secret-value \
  --secret-id "focusflow/production" \
  --query SecretString \
  --output text | jq -r 'to_entries[] | "\(.key)=\"\(.value)\""' > .env.production

chmod 600 .env.production
```

### 阿里云 KMS 凭据管家接入模式
```bash
# 绑定 ECS RAM 角色通过 aliyun cli 拉取
aliyun kms GetSecretValue \
  --SecretName "focusflow_production" \
  | jq -r '.SecretData | fromjson | to_entries[] | "\(.key)=\"\(.value)\""' > .env.production

chmod 600 .env.production
```

---

## 5. 零停机平滑轮转标准操作流程 (Rotation Runbook)

当密钥发生泄露疑虑、或按 SOC2/ISO27001 合规要求执行**定期 90 天强制轮换**时，遵循以下**零停机、零用户掉线**的三步轮换法：

### 5.1 JWT 签名私钥平滑轮换 (Sub-spec 10 § 5.1)

```bash
# 步骤 1: 准备新密钥，并将原密钥填入 PREVIOUS，更新 Vault
# 原: JWT_ACCESS_SECRET_CURRENT="Key_v1"
# 新:
JWT_ACCESS_SECRET_CURRENT="Key_v2_NewGeneratedString"
JWT_ACCESS_SECRET_PREVIOUS="Key_v1"

# 步骤 2: 重新部署 API 容器
# 此时新签发的 Token 使用 Key_v2，而老用户持有的 Key_v1 在 15 分钟内通过 PREVIOUS 校验放行
docker compose -f deploy/docker-compose.prod.yml up -d --no-deps api

# 步骤 3: 等待 15 分钟 (所有旧 Access Token 自然失效)
# 从 Vault 移除 JWT_ACCESS_SECRET_PREVIOUS 并重新部署
# 达成 100% 零用户被踢下线、零感知安全轮换！
```

### 5.2 数据库密码热变更流程

1. PostgreSQL 主库为应用创建双账号或修改密码：
   ```sql
   ALTER USER focusflow_app WITH PASSWORD 'NewStrongPassword123';
   ```
2. 更新 `deploy/pgbouncer/userlist.txt` 中的密码；
3. 向 PgBouncer 发送 `RELOAD` 指令（**无需重启容器，毫秒级无损热加载**）：
   ```bash
   docker exec -it focusflow-pgbouncer psql -p 6432 -U focusflow_admin pgbouncer -c "RELOAD;"
   ```
4. 全站应用连接自动使用新密码平滑通信，对外业务 0 报错。

---

## 6. 应急阻断与凭证吊销演练 (Incident Response)

发生严重安全事件（如特定员工离职、API 凭证疑似外泄）时的快速止血手册：

1. **全网特定 JTI 立即拉黑**：
   在 Redis 中写入黑名单键：
   ```bash
   # 阻断特定 Token
   SET auth:blacklist:jti:<JTI> "REVOKED" EX 86400
   
   # 阻断特定用户的所有会话
   SET auth:user:revoked_before:<USER_ID> "<CURRENT_UNIX_TIMESTAMP>" EX 604800
   ```
2. **SuperAdmin 2FA 强制重置**：
   在运营后台执行解绑，系统自动作废 TOTP Secret 并注销已有 Cookie，强制下次登录重新扫码绑定。
