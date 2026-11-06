const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync('extension/button-align.js','utf8').replace(/^import .*;\n/gm,'').replace('export function installButtonAlignment','function installButtonAlignment')+'\nglobalThis.installButtonAlignment=installButtonAlignment;';
for(const offset of [-12,-7.5,9,0]){
 let nextId=0;const signals=new Map();
 const hooks={connect(_n,f){const id=++nextId;signals.set(id,f);return id;},disconnect(id){assert(signals.delete(id));}};
 let activeOffset=offset;
 const indicators={...hooks,translation_x:0,get_children:()=>[active,inactive]};
 const active={expansion:1,_dot:{get_transformed_position:()=>[100+33+activeOffset-14+indicators.translation_x,0],get_transformed_size:()=>[28,8]}};
 const inactive={expansion:0,_dot:{}};
 const button={...hooks,get_first_child:()=>indicators,get_transformed_position:()=>[100,0],get_transformed_size:()=>[66,32]};
 const styled=(style)=>({style,get_style(){return this.style;},set_style(s){this.style=s;}});
 const label=styled(null),clock={...hooks,...styled('color: white;'),_clockDisplay:label,_natHPadding:12,_minHPadding:6};
 const context={Main:{panel:{statusArea:{activities:button,dateMenu:clock}}}};
 vm.createContext(context);vm.runInContext(code,context);const cleanup=context.installButtonAlignment();
 const error=()=>active._dot.get_transformed_position()[0]+14-133;
 assert(Math.abs(error())<0.1);assert(clock.style.includes('-natural-hpadding: 0px'));assert(label.style.includes('padding-left: 0px'));assert.equal(clock._natHPadding,0);assert(!label.style.startsWith(';'));
 activeOffset=15;[...signals.values()].forEach(f=>f());assert(Math.abs(error())<0.1);
 assert.equal(indicators.get_children().length,2); // inactive slot was not removed
 cleanup();cleanup();assert.equal(signals.size,0);assert.equal(indicators.translation_x,0);assert.equal(clock.style,'color: white;');assert.equal(label.style,null);assert.equal(clock._natHPadding,12);assert.equal(clock._minHPadding,6);
}
console.log('PASS: capsule centered inside button; fractional offsets and relayout; workspace slots retained; clock style and translations restored');
