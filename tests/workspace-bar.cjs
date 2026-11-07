// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
class Actor{constructor(p={}){Object.assign(this,p);this.children=[];if(p.child)this.add_child(p.child);}add_child(a){this.children.push(a);}remove_child(a){this.children.splice(this.children.indexOf(a),1);}get_first_child(){return this.children[0];}get_children(){return this.children;}destroy(){this.dead=true;this.children.forEach(a=>a.destroy());}}
for(const initialCount of [1,2,4]){
 const native=new Actor();for(let i=0;i<initialCount;i++)native.add_child(new Actor({expansion:i===0?1:0}));
 const button=new Actor();button.add_child(native);let stopped=0,previewed=0;
 const makeStop=()=>()=>stopped++;
 const ctx={St:{Widget:Actor,Bin:Actor},Clutter:{ActorAlign:{CENTER:2}},Main:{panel:{statusArea:{activities:button}}},installRgbIndicator:makeStop,installButtonAlignment:makeStop,installScreenCenter:makeStop,installTitleBurst:()=>{const stop=makeStop();stop.preview=()=>previewed++;stop.inspect=()=>({phase:'idle'});return stop;}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('extension/bar-colored-title.js','utf8').replace(/^import .*;\n/gm,'').replace('export function','function')+'\nglobalThis.install=installBarColoredTitle;',ctx);
 const stop=ctx.install(),content=button.get_first_child(),pill=content.get_first_child();assert.equal(pill.width,81);assert.equal(pill.height,13);assert.equal(content.children.length,1);
 // New workspaces, native active-workspace changes and removal do not change
 // the independent status bar, even after native dots have been rebuilt.
 native.add_child(new Actor({expansion:1}));native.children.forEach((a,i)=>a.expansion=i/5);native.remove_child(native.children[0]);
 assert.equal(button.get_first_child(),content);assert.equal(pill.width,81);assert.equal(pill.height,13);stop.preview();assert.equal(previewed,1);assert.equal(stop.inspect().phase,'idle');stop();stop();assert.equal(stopped,4);assert.equal(button.get_first_child(),native);assert(content.dead);assert(pill.dead);
}
console.log('PASS: independent 81x13 bar unaffected by native workspace creation/switch/removal; effects and cleanup preserved');
