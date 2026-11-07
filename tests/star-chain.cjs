const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
class Actor{constructor(props){Object.assign(this,props);this.children=[];}add_child(a){this.children.push(a);}ease(p){this.animation=p;}destroy(){this.destroyed=true;this.children.forEach(c=>c.destroy());}}
const context={St:{Widget:Actor},Clutter:{AnimationMode:{EASE_OUT_CUBIC:1}},Main:{panel:{get_transformed_position:()=>[100,0],get_transformed_size:()=>[1920,32]},layoutManager:{uiGroup:{add_child(){}}}}};
vm.createContext(context);vm.runInContext(fs.readFileSync('extension/star-chain.js','utf8').replace(/^import .*;\n/gm,'').replace('export function','function')+'\nglobalThis.play=playStarChain;',context);
const holder={actor:null,clear(){this.actor?.destroy();this.actor=null;}};
const src={get_transformed_position:()=>[1045,12],get_transformed_size:()=>[29,8],get_style:()=>'background-color:rgb(128,65,220);'};
context.play(holder,src,[[255,0,0]]);const first=holder.actor,bar=first.children[0];
assert.equal(first.children.length,1);assert(first.clip_to_allocation);assert.equal(bar.y,12);assert.equal(bar.height,8);assert.equal(bar.width,29);assert.equal(bar.animation.x,0);assert.equal(bar.animation.width,1920);assert.equal(bar.animation.duration,5000);assert.equal(bar.animation.opacity,0);assert(!('height' in bar.animation));assert(!('y' in bar.animation));assert(!bar.reactive);assert(bar.style.includes('rgb(128,65,220)'));
context.play(holder,src,[[0,0,255]]);assert(first.destroyed);const next=holder.actor;bar.animation.onComplete();assert.equal(holder.actor,next);next.children[0].animation.onComplete();assert.equal(holder.actor,null);
console.log('PASS: one continuous pill, original height/center/color, full-panel width, 5s fade, passive input and repeated-click cleanup');
