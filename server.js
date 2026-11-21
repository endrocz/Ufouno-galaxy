'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.join(__dirname,'public'),DATA=path.join(__dirname,'data','profiles.json');
const PORT=Number(process.env.PORT||3000),HOST=process.env.HOST||'0.0.0.0';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.css':'text/css; charset=utf-8'};
fs.mkdirSync(path.dirname(DATA),{recursive:true});let records={};try{records=JSON.parse(fs.readFileSync(DATA,'utf8'))}catch{}
function save(){const tmp=DATA+'.tmp';fs.writeFileSync(tmp,JSON.stringify(records,null,2));fs.renameSync(tmp,DATA)}
function out(res,status,obj){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'authorization, content-type','access-control-allow-methods':'GET,POST,OPTIONS'});res.end(JSON.stringify(obj))}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>4096){reject(Error('Příliš velký požadavek'));req.destroy()}});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch{reject(Error('Nesprávný JSON'))}});req.on('error',reject)})}
const rates=new Map();function limited(req){const ip=req.socket.remoteAddress||'unknown',now=Date.now(),r=rates.get(ip)||{n:0,t:now};if(now-r.t>60000){r.n=0;r.t=now}r.n++;rates.set(ip,r);return r.n>100}
function token(req){const h=req.headers.authorization||'';return h.startsWith('Bearer ')?h.slice(7):''}
function findProfile(req){const t=token(req);return /^[a-f0-9]{64}$/.test(t)?Object.values(records).find(p=>crypto.timingSafeEqual(Buffer.from(p.token),Buffer.from(t))):undefined}
function leaderboard(){return Object.values(records).map(x=>({id:x.id,nick:x.nick,wins:x.wins,onlineWins:x.onlineWins,updated:x.updated})).sort((a,b)=>b.wins-a.wins||a.updated-b.updated).slice(0,100).map((x,i)=>({...x,rank:i+1}))}
const server=http.createServer(async(req,res)=>{try{if(limited(req))return out(res,429,{error:'Příliš mnoho požadavků'});if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-origin':'*','access-control-allow-headers':'authorization, content-type','access-control-allow-methods':'GET,POST,OPTIONS'});return res.end()}const url=new URL(req.url,'http://localhost');let p=url.pathname;
if(p==='/api/health')return out(res,200,{ok:true,service:'UFONO Galaxy Global',mode:'community-beta'});
if(p==='/api/leaderboard'&&req.method==='GET')return out(res,200,{players:leaderboard(),total:Object.keys(records).length,verified:false});
if(p==='/api/register'&&req.method==='POST'){
 const b=await body(req);let existing=findProfile(req);if(existing){existing.nick=String(b.nick||existing.nick).trim().slice(0,18)||'Ufoun';existing.updated=Date.now();save();return out(res,200,{id:existing.id,nick:existing.nick,wins:existing.wins})}
 const id=crypto.randomUUID(),tok=crypto.randomBytes(32).toString('hex'),nick=String(b.nick||'Ufoun').trim().slice(0,18)||'Ufoun';records[id]={id,token:tok,nick,wins:0,onlineWins:0,updated:Date.now(),lastEvent:''};save();return out(res,201,{id,token:tok,nick,wins:0})}
if(p==='/api/sync'&&req.method==='POST'){
 const u=findProfile(req);if(!u)return out(res,401,{error:'Nejdřív přihlásit profil'});const b=await body(req);if(typeof b.nick==='string')u.nick=b.nick.trim().slice(0,18)||u.nick;
 // Beta offline total sync is monotone but not verified. Cap each update to mitigate blatant spamming.
 let n=Number(b.wins);if(!Number.isSafeInteger(n)||n<0||n>1000000)return out(res,400,{error:'Neplatný počet výher'});if(n-u.wins>50)return out(res,409,{error:'Najednou lze synchronizovat maximálně 50 výher. Kontaktuj provozovatele.'});u.wins=Math.max(u.wins,n);u.updated=Date.now();save();return out(res,200,{wins:u.wins,nick:u.nick,verified:false})}
if(p.startsWith('/api/'))return out(res,404,{error:'Nenalezeno'});
if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
if(p==='/')p='/index.html';const full=path.resolve(ROOT,'.'+decodeURIComponent(p));if(!full.startsWith(ROOT+path.sep))return out(res,403,{error:'Nepovoleno'});
fs.readFile(full,(err,bytes)=>{if(err){res.writeHead(404);return res.end('Nenalezeno')}res.writeHead(200,{'content-type':MIME[path.extname(full)]||'application/octet-stream','x-content-type-options':'nosniff','cache-control':p==='/sw.js'?'no-cache':'public, max-age=300'});res.end(req.method==='HEAD'?'':bytes)})
}catch(e){out(res,400,{error:'Chyba požadavku'})}});
if(require.main===module)server.listen(PORT,HOST,()=>console.log(`UFONO Galaxy Global na http://localhost:${PORT}`));module.exports=server;
