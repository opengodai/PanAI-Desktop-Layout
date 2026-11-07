const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const natural of [8,22,22.5,23]){
 const callbacks=new Map();let id=0;
 const dot={get_preferred_width:()=>[natural,natural],connect(_n,f){callbacks.set(++id,f);return id;},disconnect(i){callbacks.delete(i);}};
 const actor={_dot:dot,widthMultiplier:3.625,connect(_n,f){callbacks.set(++id,f);return id;},disconnect(i){callbacks.delete(i);}};
 const ctx={Main:{panel:{statusArea:{activities:{get_first_child:()=>({get_children:()=>[actor]})}}}}};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('extension/exact-bar-size.js','utf8').replace(/^import .*;\n/gm,'').replace('export function','function')+'\nglobalThis.install=installExactBarSize;',ctx);
 const cleanup=ctx.install();assert.equal(Math.round(natural*actor.widthMultiplier),81);actor.widthMultiplier=3.625;[...callbacks.values()].forEach(f=>f());assert.equal(Math.round(natural*actor.widthMultiplier),81);cleanup();cleanup();assert.equal(actor.widthMultiplier,3.625);assert.equal(callbacks.size,0);
}
console.log('PASS: exact 81px across natural-size rounding, native multiplier resets and cleanup');
