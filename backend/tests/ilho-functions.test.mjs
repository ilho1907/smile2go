// Tests der Edge-Einstiegspunkte. Keine Netzwerkaufrufe und keine echten Zugangsdaten.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const token = 'x'.repeat(40);
async function start(name, settings = {}) {
  const events = [];
  const env = { ILHO_CRON_TOKEN: token, MISTRAL_API_KEY: 'test' };
  const db = {
    auth: { async getUser() { return { data: { user: settings.signedIn ? { id: 'test-user' } : null } }; } },
    rpc: async (fn, args) => {
      events.push({ fn, args });
      if (fn === 'ilho_wochenzahlen') return { data: settings.stats };
      return { data: 1 };
    },
    from(table) {
      const chain = {
        select() { return this; }, eq() { return this; }, lte() { return Promise.resolve({ data: settings.grants ?? [] }); },
        insert: async () => ({ error: null }),
        update(value) { events.push({ table, value }); return this; },
        delete() { return this; }, is() { return this; },
      };
      return chain;
    },
  };
  let handler;
  const Deno = { env: { get: key => env[key] }, serve: fn => { handler = fn; } };
  const fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    events.push({ model: body });
    const reply = settings.replies.shift();
    return Response.json({ choices: [{ message: { content: JSON.stringify(reply) } }] });
  };
  const file = new URL('../supabase/functions/'+name+'/index.ts', import.meta.url);
  let code = stripTypeScriptTypes(await readFile(file,'utf8'));
  code = code.replace('import { createClient } from "jsr:@supabase/supabase-js@2";','');
  code = code.replace('import { timingSafeEqual } from "node:crypto";','');
  const { timingSafeEqual } = await import('node:crypto');
  Function('Deno','createClient','fetch','timingSafeEqual',code)(Deno,()=>db,fetch,timingSafeEqual);
  return { events, handler };
}
function post(headers={},content={}) {
  return new Request('https://test.invalid/',{method:'POST',headers,body:JSON.stringify(content)});
}
const messages=[{role:'user',content:'Alter Text'},{role:'assistant',content:'Alte Antwort'},{role:'user',content:'Neue Nachricht'}];
test('Chat verlangt einen verifizierten Benutzer',async()=>{
  const {handler,events}=await start('ilho-chat');
  assert.equal((await handler(post({authorization:'Bearer synthetisch'},{messages}))).status,401);
  assert.equal(events.length,0);
});
test('Ohne Freigabe wird nur die Chatantwort erzeugt',async()=>{
  const {handler,events}=await start('ilho-chat',{signedIn:true,replies:[{text:'Hallo',krise:false}]});
  assert.equal((await (await handler(post({authorization:'Bearer test'},{messages}))).json()).text,'Hallo');
  assert.equal(events.filter(e=>e.model).length,1);
  assert.ok(!events.some(e=>e.fn==='ilho_erkenntnis_speichern'));
});
test('Für die Auswertung wird nur die aktuelle Nachricht gesendet',async()=>{
  const {handler,events}=await start('ilho-chat',{signedIn:true,grants:[{bereich:'stimmung'}],
    replies:[{text:'Antwort',krise:false},{krise:false,stimmung:4}]});
  await handler(post({authorization:'Bearer test'},{messages}));
  assert.equal(events.filter(e=>e.model)[1].model.messages.at(-1).content,'Neue Nachricht');
  assert.equal(events.find(e=>e.fn==='ilho_erkenntnis_speichern').args.p_stimmung,4);
});
test('Krisensignal im Chat oder unklare Einstufung verhindern eine Speicherung',async()=>{
  for(const replies of [[{text:'Antwort',krise:true}],[{text:'Antwort'}],[{text:'Antwort',krise:false},{}]]){
    const {handler,events}=await start('ilho-chat',{signedIn:true,grants:[{bereich:'stimmung'}],replies});
    await handler(post({authorization:'Bearer test'},{messages}));
    assert.ok(!events.some(e=>e.fn==='ilho_erkenntnis_speichern'));
  }
});
test('Wochenlauf ohne Cron-Token kontaktiert weder Datenbank noch Mistral',async()=>{
  const {handler,events}=await start('ilho-lernen');
  assert.equal((await handler(post())).status,401);assert.equal(events.length,0);
});
test('Kleine Gruppe löst keine Modellanfrage aus',async()=>{
  const {handler,events}=await start('ilho-lernen',{stats:{gespraeche:10,auswertbar:false}});
  assert.equal((await handler(post({'X-Ilho-Cron':token}))).status,200);
  assert.ok(!events.some(e=>e.model));
});
test('Das Lernmodell erhält nur die Gruppenstatistik',async()=>{
  const stats={gespraeche:10,auswertbar:true,stimmung:4,themen:{Alltag:10}};
  const {handler,events}=await start('ilho-lernen',{stats,replies:[{muster:[]}]});
  assert.equal((await handler(post({'X-Ilho-Cron':token}))).status,200);
  assert.deepEqual(JSON.parse(events.find(e=>e.model).model.messages.at(-1).content),stats);
});
