import express from "express";
import helmet from "helmet";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT || 8080);
const API_URL = "https://backboard.railway.com/graphql/v2";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10kb" }));

const origins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(x => x.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (origins.length === 0 || origins.includes(origin)) return cb(null, true);
    return cb(new Error("Origin not allowed"));
  }
}));

function requireAuth(req, res, next) {
  const secret = process.env.PANEL_PASSWORD;
  if (!secret) return res.status(503).json({ error: "Backend setup incomplete: PANEL_PASSWORD is missing." });
  const header = req.get("authorization") || "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (given.length !== secret.length || !constantTimeEqual(given, secret)) {
    return res.status(401).json({ error: "Incorrect panel password." });
  }
  next();
}
function constantTimeEqual(a, b) {
  let result = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return result === 0;
}
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing Railway Variable: ${name}`);
  return value;
}
async function railway(query, variables = {}) {
  const token = required("RAILWAY_API_TOKEN");
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ query, variables })
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.errors?.length) {
    const message = body.errors?.map(x => x.message).join("; ") || `Railway API HTTP ${r.status}`;
    throw new Error(message);
  }
  return body.data;
}
function target() {
  return {
    projectId: required("RAILWAY_PROJECT_ID"),
    serviceId: required("RAILWAY_SERVICE_ID"),
    environmentId: required("RAILWAY_ENVIRONMENT_ID")
  };
}
async function getLatestDeployment() {
  const t = target();
  const data = await railway(
    `query($input: DeploymentListInput!) {
      deployments(input: $input, first: 1) {
        edges { node { id status createdAt url } }
      }
    }`,
    { input: t }
  );
  return data.deployments?.edges?.[0]?.node || null;
}
app.get("/health", (_req, res) => res.json({ ok: true, service: "SACHI-MD-PANEL-API" }));
app.get("/api/status", requireAuth, async (_req, res) => {
  try {
    const d = await getLatestDeployment();
    res.json({ connected: true, status: d?.status || "NO_DEPLOYMENT", deploymentId: d?.id || null, createdAt: d?.createdAt || null, url: d?.url || null });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
app.post("/api/restart", requireAuth, async (_req, res) => {
  try {
    const d = await getLatestDeployment();
    if (!d) return res.status(404).json({ error: "No deployment found for configured service." });
    await railway(`mutation($id: String!) { deploymentRestart(id: $id) }`, { id: d.id });
    res.json({ ok: true, message: "Restart request sent to Railway." });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
app.post("/api/stop", requireAuth, async (_req, res) => {
  try {
    const d = await getLatestDeployment();
    if (!d) return res.status(404).json({ error: "No deployment found for configured service." });
    await railway(`mutation($id: String!) { deploymentStop(id: $id) }`, { id: d.id });
    res.json({ ok: true, message: "Stop request sent to Railway." });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
app.post("/api/start", requireAuth, async (_req, res) => {
  try {
    const t = target();
    await railway(
      `mutation($input: EnvironmentTriggersDeployInput!) { environmentTriggersDeploy(input: $input) }`,
      { input: t }
    );
    res.json({ ok: true, message: "Deploy request sent to Railway." });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
app.get("/api/logs", requireAuth, async (_req, res) => {
  try {
    const d = await getLatestDeployment();
    if (!d) return res.status(404).json({ error: "No deployment found for configured service." });
    const data = await railway(
      `query($deploymentId: String!, $limit: Int) {
        deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
          timestamp message severity
        }
      }`,
      { deploymentId: d.id, limit: 100 }
    );
    res.json({ logs: data.deploymentLogs || [] });
  } catch (e) { res.status(502).json({ error: e.message }); }
});
app.use((err, _req, res, _next) => res.status(400).json({ error: err.message || "Request error" }));
app.listen(PORT, "0.0.0.0", () => console.log(`Panel API listening on ${PORT}`));
