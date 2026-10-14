const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const moduleResult={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('app/archive-records.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(moduleResult,moduleResult.exports);
const {collectArchivePages,normalizeWorkRefs}=moduleResult.exports;
test('whole search includes profiles after page 24 and page 100, including an exact full final page',async()=>{
 const pages=[Array.from({length:100},(_,i)=>i),Array.from({length:100},(_,i)=>100+i),[]];let calls=0;
 const records=await collectArchivePages(async cursor=>{assert.equal(cursor,calls?calls-1:undefined);const items=pages[calls++];return{items,cursor:calls-1,hasMore:items.length===100}},()=>false);
 assert.equal(calls,3);assert.equal(records.length,200);assert.ok(records.includes(175));
});
test('cancelled searches stop before another page and cannot publish incomplete results',async()=>{
 let calls=0;const records=await collectArchivePages(async()=>{calls++;return{items:['first'],cursor:1,hasMore:true}},()=>true);assert.equal(records,null);assert.equal(calls,1);
});
test('a failed page rejects rather than returning a partial archive',async()=>{
 let calls=0;await assert.rejects(collectArchivePages(async()=>{if(calls++)throw Error('offline');return{items:['first'],cursor:1,hasMore:true}},()=>false),/offline/);
});
test('work references tolerate legacy records and reject malformed or duplicate links',()=>{
 assert.deepEqual(normalizeWorkRefs(undefined),[]);assert.deepEqual(normalizeWorkRefs([null,{}, {artistSlug:'a',workId:'w',private:'omit'},{artistSlug:'a',workId:'w'},{artistSlug:'b',workId:'w'}, {artistSlug:'',workId:'x'}]),[{artistSlug:'a',workId:'w'},{artistSlug:'b',workId:'w'}]);
});
