// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let nextId=0;const signals=new Map();
const hooks={connect(name,fn){const id=++nextId;signals.set(id,fn);return id;},disconnect(id){signals.delete(id);}};
let width=29;const content={...hooks,translation_x:0,get_children:()=>[{expansion:1,_dot:dot}]};
const dot={...hooks,get_transformed_position:()=>[945.5+content.translation_x,12],get_transformed_size:()=>[width,8]};
const clock={...hooks,_natHPadding:12,_minHPadding:6,get_style:()=>null,set_style(){},_clockDisplay:{get_style:()=>null,set_style(){}}};
const button={...hooks,get_first_child:()=>content,get_transformed_position:()=>[924,0],get_transformed_size:()=>[72,32]};
const ctx={Main:{panel:{statusArea:{activities:button,dateMenu:clock}}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('extension/button-align.js','utf8').replace(/^import .*;\n/gm,'').replace('export function','function')+'\nglobalThis.install=installButtonAlignment;',ctx);
const cleanup=ctx.install();width=80;for(const fn of [...signals.values()])fn();assert.equal(dot.get_transformed_position()[0]+width/2,960);cleanup();assert.equal(signals.size,0);console.log('PASS: inner pill 29→80px stays centered at x=960, callbacks fully disconnected');
