import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs'; import * as path from 'path';
function loadEnv() {
  const env: Record<string,string> = {};
  for (const line of fs.readFileSync(path.join(process.cwd(),'.env.local'),'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/); if (m) env[m[1]]=m[2].trim();
  }
  return env;
}
const env = loadEnv();
const sb = createClient(env['SUPABASE_URL']??'', env['SUPABASE_SERVICE_ROLE_KEY']??'');
async function main() {
  const {data:mats} = await sb.from('materials' as any).select('technical_code,texture,lightness,warmth,chroma,role');
  const {data:pc}   = await sb.from('pair_compatibility' as any).select('code_a,code_b,weight');
  const count = new Map<string,number>();
  for (const r of pc??[]) { count.set(r.code_a,(count.get(r.code_a)??0)+1); count.set(r.code_b,(count.get(r.code_b)??0)+1); }
  const pairW = new Map<string,number>();
  for (const r of pc??[]) pairW.set(`${r.code_a}::${r.code_b}`,r.weight??1);

  for (const [role, compRole] of [['front','floor'],['floor','front']]) {
    const pool = (mats??[] as any[]).filter((m:any)=>Array.isArray(m.role)&&m.role.includes(compRole)&&m.texture==='wood');
    pool.sort((a:any,b:any)=>(count.get(b.technical_code)??0)-(count.get(a.technical_code)??0));
    const ref = pool[0] as any;
    console.log(`\n${role.toUpperCase()} chips → cross-role ref from ${compRole}: ${ref?.technical_code}  L=${ref?.lightness}  W=${ref?.warmth}  pairs=${count.get(ref?.technical_code)??0}`);
    // show candidates that are paired with this ref
    const candidates = (mats??[] as any[]).filter((m:any)=>Array.isArray(m.role)&&m.role.includes(role)&&m.texture==='wood');
    const withPair = candidates.map((m:any)=>{
      const key1=`${m.technical_code}::${ref.technical_code}`, key2=`${ref.technical_code}::${m.technical_code}`;
      const w = pairW.get(key1)??pairW.get(key2)??0;
      return {...m, pairW:w, pairScore:(w/3).toFixed(3)};
    }).filter((m:any)=>m.pairW>0).sort((a:any,b:any)=>b.pairW-a.pairW);
    console.log(`  Candidates paired with ref:`);
    for (const m of withPair.slice(0,8)) console.log(`    ${m.technical_code}  L=${m.lightness}  ΔL=${((m.lightness-ref.lightness)/100).toFixed(2)}  pairScore=${m.pairScore}`);
  }
}
main().catch(console.error);
