const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'climacrave.sqlite');
const db = new DatabaseSync(DB_FILE);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    username_key TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    q1 INTEGER,
    a1_hash TEXT,
    q2 INTEGER,
    a2_hash TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS app_state (
    username_key TEXT NOT NULL,
    state_key TEXT NOT NULL,
    state_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (username_key, state_key),
    FOREIGN KEY (username_key) REFERENCES users(username_key) ON DELETE CASCADE
  );
`);

const userUpsert = db.prepare(`
  INSERT INTO users(username_key, username, password_hash, q1, a1_hash, q2, a2_hash, created_at)
  VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(username_key) DO UPDATE SET
    username=excluded.username,
    password_hash=excluded.password_hash,
    q1=excluded.q1,
    a1_hash=excluded.a1_hash,
    q2=excluded.q2,
    a2_hash=excluded.a2_hash
`);
const stateUpsert = db.prepare(`
  INSERT INTO app_state(username_key, state_key, state_json, updated_at)
  VALUES(?, ?, ?, ?)
  ON CONFLICT(username_key, state_key) DO UPDATE SET
    state_json=excluded.state_json,
    updated_at=excluded.updated_at
`);
const stateGet = db.prepare('SELECT state_json FROM app_state WHERE username_key=? AND state_key=?');
const stateAll = db.prepare('SELECT state_key, state_json FROM app_state WHERE username_key=?');
const userGet = db.prepare('SELECT * FROM users WHERE username_key=?');

function send(res, status, data, headers={}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...headers});
  res.end(body);
}
function key(username){ return String(username || '').trim().toLowerCase(); }
async function body(req){
  let s=''; for await(const chunk of req) s += chunk;
  if(!s) return {};
  try{return JSON.parse(s);}catch{return null;}
}
function serveStatic(req,res){
  let urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  if(urlPath === '/') urlPath='/index.html';
  const full = path.normalize(path.join(ROOT,urlPath));
  if(!full.startsWith(ROOT)) return send(res,403,{error:'Forbidden'});
  fs.stat(full,(err,st)=>{
    if(err || !st.isFile()) return send(res,404,{error:'Not found'});
    const ext=path.extname(full).toLowerCase();
    const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});
    fs.createReadStream(full).pipe(res);
  });
}

const server=http.createServer(async (req,res)=>{
  try{
    const url=new URL(req.url,`http://localhost:${PORT}`);
    if(url.pathname.startsWith('/api/')){
      if(req.method==='GET' && url.pathname==='/api/health') return send(res,200,{ok:true,database:DB_FILE});

      if(req.method==='POST' && url.pathname==='/api/auth/upsert'){
        const b=await body(req); if(!b || !b.username) return send(res,400,{error:'Invalid account'});
        const u=key(b.username);
        userUpsert.run(u,b.username,String(b.passwordHash||''),Number.isInteger(b.q1)?b.q1:null,String(b.a1Hash||''),Number.isInteger(b.q2)?b.q2:null,String(b.a2Hash||''),Number(b.createdAt||Date.now()));
        return send(res,200,{ok:true});
      }

      if(req.method==='GET' && url.pathname==='/api/auth/get'){
        const u=key(url.searchParams.get('username')); if(!u) return send(res,400,{error:'username required'});
        const row=userGet.get(u); return row ? send(res,200,{ok:true,account:row}) : send(res,404,{error:'Not found'});
      }

      if((req.method==='PUT'||req.method==='POST') && url.pathname.startsWith('/api/state/')){
        const stateKey=decodeURIComponent(url.pathname.slice('/api/state/'.length));
        const b=await body(req); if(!b || !b.username) return send(res,400,{error:'username required'});
        const u=key(b.username);
        if(!userGet.get(u)) return send(res,404,{error:'Account not found'});
        stateUpsert.run(u,stateKey,JSON.stringify(b.value ?? null),Date.now());
        return send(res,200,{ok:true});
      }

      if(req.method==='GET' && url.pathname==='/api/state'){
        const u=key(url.searchParams.get('username')), k=url.searchParams.get('key');
        if(!u||!k)return send(res,400,{error:'username and key required'});
        const row=stateGet.get(u,k); return row ? send(res,200,{ok:true,value:JSON.parse(row.state_json)}) : send(res,404,{error:'Not found'});
      }

      if(req.method==='GET' && url.pathname==='/api/state/all'){
        const u=key(url.searchParams.get('username')); if(!u)return send(res,400,{error:'username required'});
        const rows=stateAll.all(u); const state={};
        for(const row of rows){try{state[row.state_key]=JSON.parse(row.state_json);}catch{}}
        return send(res,200,{ok:true,state});
      }
      return send(res,404,{error:'API route not found'});
    }
    serveStatic(req,res);
  }catch(e){ console.error(e); send(res,500,{error:'Server error'}); }
});

server.listen(PORT,()=>console.log(`ClimaCrave running at http://localhost:${PORT}`));
