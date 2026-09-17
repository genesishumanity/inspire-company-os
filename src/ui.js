export function renderOffice() {
  return String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>INSPIRE Company OS</title>
  <style>
    :root{color-scheme:dark;--bg:#090b0e;--panel:#11151a;--panel2:#161b22;--line:#242b34;--text:#f2f5f7;--muted:#8b96a3;--accent:#9ed8ff;--good:#8ce99a;--warn:#ffd166;--bad:#ff7b7b;--violet:#c3a6ff}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,select,textarea{font:inherit}button{cursor:pointer}.shell{max-width:1600px;margin:0 auto;padding:22px}.topbar{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}.brand h1{margin:0;font-size:26px;letter-spacing:-.04em}.brand p{margin:4px 0 0;color:var(--muted)}.stats{display:flex;gap:8px;flex-wrap:wrap}.stat{background:var(--panel);border:1px solid var(--line);padding:9px 11px;border-radius:10px;min-width:92px}.stat b{display:block;font-size:16px}.stat span{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(330px,.8fr);gap:14px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}.panel-head{display:flex;align-items:center;justify-content:space-between;padding:13px 14px;border-bottom:1px solid var(--line)}.panel-head h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;margin:0}.panel-head span{color:var(--muted);font-size:12px}.office{padding:16px;min-height:480px;background:linear-gradient(90deg,transparent 49.6%,#161c23 49.6%,#161c23 50.4%,transparent 50.4%),linear-gradient(0deg,transparent 49.6%,#161c23 49.6%,#161c23 50.4%,transparent 50.4%);background-size:96px 96px}.office-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.agent{background:rgba(17,21,26,.96);border:1px solid var(--line);border-radius:12px;padding:14px;min-height:150px;display:flex;flex-direction:column;justify-content:space-between}.agent-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.agent h3{margin:0 0 3px;font-size:16px}.agent .dept{color:var(--muted);font-size:12px}.status{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);padding:4px 7px;border-radius:999px;font-size:11px;text-transform:uppercase;letter-spacing:.06em}.dot{width:7px;height:7px;border-radius:50%;background:#727b86}.status.working .dot{background:var(--good)}.status.thinking .dot{background:var(--accent)}.status.waiting .dot{background:var(--warn)}.status.blocked .dot{background:var(--bad)}.status.reviewing .dot{background:var(--violet)}.status.sleeping .dot{background:#66707b}.reason{color:var(--muted);font-size:12px;margin:16px 0 10px;min-height:34px}.actions{display:flex;gap:7px}.btn{border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:8px;padding:7px 9px}.btn:hover{border-color:#46515e}.btn.primary{background:#d8efff;color:#071018;border-color:#d8efff}.btn.good{border-color:#406948}.btn.bad{border-color:#814848}.side{display:grid;gap:14px;align-content:start}.scroll{max-height:300px;overflow:auto}.feed-item,.inbox-item,.row{padding:11px 13px;border-bottom:1px solid var(--line)}.feed-item:last-child,.inbox-item:last-child,.row:last-child{border-bottom:0}.feed-meta,.meta{color:var(--muted);font-size:11px;margin-top:4px}.feed-type{color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:.08em}.inbox-item strong{display:block;margin-bottom:4px}.badge{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:2px 6px;color:var(--muted);font-size:10px;text-transform:uppercase}.lower{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}.form{padding:12px;display:grid;gap:8px;border-top:1px solid var(--line)}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}input,select,textarea{width:100%;background:#0d1116;color:var(--text);border:1px solid var(--line);border-radius:8px;padding:8px}textarea{min-height:72px;resize:vertical}.task-title,.msg-title{font-weight:650}.task-line{display:flex;justify-content:space-between;gap:8px;align-items:center}.empty{padding:20px;color:var(--muted);text-align:center}.modal{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;padding:20px;z-index:20}.modal.open{display:flex}.modal-card{width:min(760px,100%);max-height:86vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:14px}.modal-head{position:sticky;top:0;background:var(--panel);display:flex;justify-content:space-between;align-items:center;padding:14px;border-bottom:1px solid var(--line)}.modal-body{padding:14px}.small{font-size:12px;color:var(--muted)}.error{position:fixed;right:20px;bottom:20px;background:#2a1111;border:1px solid #6e3434;color:#ffd1d1;padding:10px 12px;border-radius:10px;display:none;z-index:50}.error.show{display:block}@media(max-width:980px){.grid,.lower{grid-template-columns:1fr}.office-grid{grid-template-columns:1fr}.topbar{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body>
  <div class="shell">
    <div class="topbar">
      <div class="brand"><h1>INSPIRE Company OS</h1><p>Real events only. No synthetic office motion.</p></div>
      <div class="stats" id="stats"></div>
    </div>

    <div class="grid">
      <section class="panel">
        <div class="panel-head"><h2>2D Office</h2><span id="serverTime">—</span></div>
        <div class="office"><div class="office-grid" id="agents"></div></div>
      </section>
      <div class="side">
        <section class="panel"><div class="panel-head"><h2>Live Activity</h2><span>backend events</span></div><div class="scroll" id="feed"></div></section>
        <section class="panel"><div class="panel-head"><h2>Founder Inbox</h2><span id="inboxCount">0 items</span></div><div class="scroll" id="inbox"></div></section>
      </div>
    </div>

    <div class="lower">
      <section class="panel">
        <div class="panel-head"><h2>Shared Tasks</h2><span>status drives agent state</span></div>
        <div class="scroll" id="tasks"></div>
        <form class="form" id="taskForm">
          <div class="form-row"><input id="taskTitle" placeholder="Task title" required><select id="taskOwner"></select></div>
          <div class="form-row"><select id="taskPriority"><option>normal</option><option>high</option><option>critical</option><option>low</option></select><label class="small"><input style="width:auto" type="checkbox" id="taskApproval"> Founder approval required</label></div>
          <textarea id="taskDescription" placeholder="Description"></textarea><button class="btn primary">Create task</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Agent Messages</h2><span>delivery does not auto-run AI</span></div>
        <div class="scroll" id="messages"></div>
        <form class="form" id="messageForm">
          <div class="form-row"><select id="msgSender"></select><select id="msgRecipient"></select></div>
          <input id="msgSubject" placeholder="Subject"><textarea id="msgBody" placeholder="Message" required></textarea><button class="btn primary">Send event</button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Approvals</h2><span>no action executes here automatically</span></div><div class="scroll" id="approvals"></div>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Schedules / Events</h2><span>cron checks due events only</span></div>
        <div class="scroll" id="schedules"></div>
        <form class="form" id="scheduleForm">
          <div class="form-row"><select id="scheduleAgent"></select><select id="scheduleRecurrence"><option value="once">once</option><option value="hourly">hourly</option><option value="daily">daily</option><option value="weekly">weekly</option></select></div>
          <input id="scheduleTitle" placeholder="Schedule title" required><input id="scheduleTime" type="datetime-local" required><textarea id="scheduleInstruction" placeholder="Instruction" required></textarea><button class="btn primary">Schedule event</button>
        </form>
      </section>
    </div>
  </div>

  <div class="modal" id="modal"><div class="modal-card"><div class="modal-head"><strong id="modalTitle">Agent</strong><button class="btn" id="modalClose">Close</button></div><div class="modal-body" id="modalBody"></div></div></div>
  <div class="error" id="errorBox"></div>

<script>
(function(){
  var state={agents:[],events:[],tasks:[],approvals:[],messages:[],schedules:[],usage:{},founderInbox:{}};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})};
  var fmt=function(v){if(!v)return '—';try{return new Date(v+'Z'.replace('ZZ','Z')).toLocaleString()}catch(e){return v}};
  function showError(msg){var b=document.getElementById('errorBox');b.textContent=msg;b.classList.add('show');setTimeout(function(){b.classList.remove('show')},4500)}
  async function api(path,options){var r=await fetch(path,Object.assign({headers:{'content-type':'application/json'}},options||{}));var data=await r.json().catch(function(){return {}});if(!r.ok)throw new Error(data.error||('HTTP '+r.status));return data}
  function statusPill(s){return '<span class="status '+esc(s)+'"><span class="dot"></span>'+esc(s)+'</span>'}
  function agentOptions(selected){return state.agents.map(function(a){return '<option value="'+esc(a.id)+'" '+(a.id===selected?'selected':'')+'>'+esc(a.name)+'</option>'}).join('')}
  function renderStats(){var active=state.agents.filter(function(a){return ['working','thinking','reviewing'].indexOf(a.status)>=0}).length;var pending=state.approvals.filter(function(a){return a.status==='pending'}).length;var usage=state.usage||{};document.getElementById('stats').innerHTML='<div class="stat"><b>'+active+'</b><span>active</span></div><div class="stat"><b>'+pending+'</b><span>approvals</span></div><div class="stat"><b>'+Number(usage.requests||0)+'</b><span>AI requests UTC</span></div><div class="stat"><b>'+Number(usage.estimated_neurons||0)+'</b><span>est. neurons</span></div>'}
  function renderAgents(){var el=document.getElementById('agents');if(!state.agents.length){el.innerHTML='<div class="empty">No agents registered.</div>';return}el.innerHTML=state.agents.map(function(a){return '<article class="agent"><div><div class="agent-top"><div><h3>'+esc(a.name)+'</h3><div class="dept">'+esc(a.department)+'</div></div>'+statusPill(a.status)+'</div><div class="reason">'+esc(a.status_reason||'No backend event yet.')+'</div></div><div class="actions"><button class="btn primary" data-run="'+esc(a.id)+'">Run</button><button class="btn" data-detail="'+esc(a.id)+'">Activity</button></div></article>'}).join('')}
  function renderFeed(){var el=document.getElementById('feed');if(!state.events.length){el.innerHTML='<div class="empty">No activity events yet.</div>';return}el.innerHTML=state.events.map(function(e){return '<div class="feed-item"><div class="feed-type">'+esc(e.event_type)+'</div><div>'+esc(e.summary)+'</div><div class="feed-meta">'+esc(e.actor_name||'system')+' · '+fmt(e.ts)+'</div></div>'}).join('')}
  function renderInbox(){var i=state.founderInbox||{},items=[];(i.approvals||[]).forEach(function(x){items.push('<div class="inbox-item"><span class="badge">approval</span><strong>'+esc(x.title)+'</strong><div>'+esc(x.rationale||'No rationale provided')+'</div><div class="meta">'+esc(x.agent_name||'system')+' · '+fmt(x.created_at)+'</div></div>')});(i.blockedTasks||[]).forEach(function(x){items.push('<div class="inbox-item"><span class="badge">blocked</span><strong>'+esc(x.title)+'</strong><div class="meta">'+esc(x.owner_name||'unassigned')+' · '+fmt(x.updated_at)+'</div></div>')});(i.unreadFounderMessages||[]).forEach(function(x){items.push('<div class="inbox-item"><span class="badge">message</span><strong>'+esc(x.subject||'Agent message')+'</strong><div>'+esc(x.body)+'</div><div class="meta">'+esc(x.sender_name||x.sender_agent_id)+' · '+fmt(x.created_at)+'</div></div>')});(i.aiAlerts||[]).forEach(function(x){items.push('<div class="inbox-item"><span class="badge">AI alert</span><strong>'+esc(x.summary)+'</strong><div class="meta">'+fmt(x.ts)+'</div></div>')});document.getElementById('inbox').innerHTML=items.length?items.join(''):'<div class="empty">Founder Inbox clear.</div>';document.getElementById('inboxCount').textContent=items.length+' items'}
  function renderTasks(){var el=document.getElementById('tasks');if(!state.tasks.length){el.innerHTML='<div class="empty">No shared tasks.</div>';return}el.innerHTML=state.tasks.map(function(t){return '<div class="row"><div class="task-line"><div><div class="task-title">'+esc(t.title)+'</div><div class="meta">'+esc(t.owner_name||'Unassigned')+' · '+esc(t.priority)+(t.approval_required?' · approval-gated':'')+'</div></div><select data-task="'+t.id+'"><option '+(t.status==='todo'?'selected':'')+'>todo</option><option value="in_progress" '+(t.status==='in_progress'?'selected':'')+'>in_progress</option><option '+(t.status==='blocked'?'selected':'')+'>blocked</option><option '+(t.status==='review'?'selected':'')+'>review</option><option '+(t.status==='done'?'selected':'')+'>done</option></select></div></div>'}).join('')}
  function renderMessages(){var el=document.getElementById('messages');if(!state.messages.length){el.innerHTML='<div class="empty">No agent messages.</div>';return}el.innerHTML=state.messages.map(function(m){return '<div class="row"><div class="msg-title">'+esc(m.sender_name)+' → '+esc(m.recipient_name)+'</div><div>'+esc(m.subject||m.body)+'</div><div class="meta">'+fmt(m.created_at)+' · '+esc(m.status)+'</div></div>'}).join('')}
  function renderApprovals(){var el=document.getElementById('approvals');if(!state.approvals.length){el.innerHTML='<div class="empty">No approvals.</div>';return}el.innerHTML=state.approvals.map(function(a){var buttons=a.status==='pending'?'<div class="actions" style="margin-top:8px"><button class="btn good" data-approval="'+a.id+'" data-decision="approved">Approve</button><button class="btn bad" data-approval="'+a.id+'" data-decision="rejected">Reject</button></div>':'';return '<div class="row"><div class="task-title">'+esc(a.title)+'</div><div class="meta">'+esc(a.agent_name||'system')+' · '+esc(a.action_type)+' · '+esc(a.status)+'</div>'+buttons+'</div>'}).join('')}
  function renderSchedules(){var el=document.getElementById('schedules');if(!state.schedules.length){el.innerHTML='<div class="empty">No schedules.</div>';return}el.innerHTML=state.schedules.map(function(s){return '<div class="row"><div class="task-title">'+esc(s.title)+'</div><div class="meta">'+esc(s.agent_name)+' · '+esc(s.recurrence)+' · next '+fmt(s.next_run_at)+' · '+(s.enabled?'enabled':'disabled')+'</div></div>'}).join('')}
  function hydrateSelects(){['taskOwner','msgSender','msgRecipient','scheduleAgent'].forEach(function(id){var el=document.getElementById(id);var current=el.value;el.innerHTML=(id==='taskOwner'?'<option value="">Unassigned</option>':'')+agentOptions(current)});if(!document.getElementById('msgSender').value)document.getElementById('msgSender').value='admin';if(!document.getElementById('msgRecipient').value)document.getElementById('msgRecipient').value='research'}
  function render(){renderStats();renderAgents();renderFeed();renderInbox();renderTasks();renderMessages();renderApprovals();renderSchedules();hydrateSelects();document.getElementById('serverTime').textContent='server '+new Date(state.serverTime).toLocaleTimeString()}
  async function load(){try{state=await api('/api/bootstrap');render()}catch(e){showError(e.message)}}
  async function runAgent(id){var instruction=window.prompt('Instruction for '+id);if(!instruction)return;try{await api('/api/agents/'+encodeURIComponent(id)+'/run',{method:'POST',body:JSON.stringify({instruction:instruction})});await load()}catch(e){showError(e.message);await load()}}
  async function detail(id){try{var d=await api('/api/agents/'+encodeURIComponent(id));document.getElementById('modalTitle').textContent=d.agent.name+' · '+d.agent.status;var html='<p>'+esc(d.agent.role_prompt)+'</p><h3>Recent activity</h3>'+(d.events.length?d.events.map(function(e){return '<div class="row"><b>'+esc(e.event_type)+'</b><div>'+esc(e.summary)+'</div><div class="meta">'+fmt(e.ts)+'</div></div>'}).join(''):'<div class="empty">No events.</div>')+'<h3>Tasks</h3>'+(d.tasks.length?d.tasks.map(function(t){return '<div class="row">'+esc(t.title)+' · '+esc(t.status)+'</div>'}).join(''):'<div class="empty">No tasks.</div>');document.getElementById('modalBody').innerHTML=html;document.getElementById('modal').classList.add('open')}catch(e){showError(e.message)}}
  document.addEventListener('click',function(e){var run=e.target.closest('[data-run]');if(run)runAgent(run.getAttribute('data-run'));var det=e.target.closest('[data-detail]');if(det)detail(det.getAttribute('data-detail'));var ap=e.target.closest('[data-approval]');if(ap){api('/api/approvals/'+ap.getAttribute('data-approval'),{method:'PATCH',body:JSON.stringify({status:ap.getAttribute('data-decision')})}).then(load).catch(function(err){showError(err.message)})}})
  document.addEventListener('change',function(e){if(e.target.matches('[data-task]')){api('/api/tasks/'+e.target.getAttribute('data-task'),{method:'PATCH',body:JSON.stringify({status:e.target.value})}).then(load).catch(function(err){showError(err.message)})}})
  document.getElementById('modalClose').onclick=function(){document.getElementById('modal').classList.remove('open')};document.getElementById('modal').onclick=function(e){if(e.target===this)this.classList.remove('open')};
  document.getElementById('messageForm').onsubmit=async function(e){e.preventDefault();try{await api('/api/messages',{method:'POST',body:JSON.stringify({sender_agent_id:document.getElementById('msgSender').value,recipient_agent_id:document.getElementById('msgRecipient').value,subject:document.getElementById('msgSubject').value,body:document.getElementById('msgBody').value})});document.getElementById('msgSubject').value='';document.getElementById('msgBody').value='';await load()}catch(err){showError(err.message)}};
  document.getElementById('taskForm').onsubmit=async function(e){e.preventDefault();try{await api('/api/tasks',{method:'POST',body:JSON.stringify({title:document.getElementById('taskTitle').value,description:document.getElementById('taskDescription').value,owner_agent_id:document.getElementById('taskOwner').value,created_by_agent_id:'admin',priority:document.getElementById('taskPriority').value,approval_required:document.getElementById('taskApproval').checked})});this.reset();await load()}catch(err){showError(err.message)}};
  document.getElementById('scheduleForm').onsubmit=async function(e){e.preventDefault();try{var t=new Date(document.getElementById('scheduleTime').value);await api('/api/schedules',{method:'POST',body:JSON.stringify({agent_id:document.getElementById('scheduleAgent').value,title:document.getElementById('scheduleTitle').value,instruction:document.getElementById('scheduleInstruction').value,recurrence:document.getElementById('scheduleRecurrence').value,next_run_at:t.toISOString()})});this.reset();await load()}catch(err){showError(err.message)}};
  async function poll(){await load();setTimeout(poll,document.hidden?30000:8000)}
  poll();
})();
</script>
</body></html>`;
}
