// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
class Actor {
    constructor(props = {}) {Object.assign(this, props); this.children=[]; this.signals=new Map(); this.classes=new Set();}
    add_child(a) {assert(!a.parent); a.parent=this; this.children.push(a);}
    remove_child(a) {this.children.splice(this.children.indexOf(a),1); a.parent=null;}
    insert_child_at_index(a,i) {a.parent=this; this.children.splice(i,0,a);}
    get_parent() {return this.parent;}
    get_children() {return [...this.children];}
    connect(name, fn) {const id=Symbol(name); this.signals.set(id,{name,fn}); return id;}
    disconnect(id) {assert(this.signals.delete(id));}
    emit(name) {for (const v of [...this.signals.values()]) if(v.name===name) v.fn();}
    has_style_class_name(c) {return this.classes.has(c);}
    add_style_class_name(c) {this.classes.add(c);}
    remove_style_class_name(c) {this.classes.delete(c);}
    get_transformed_position() {return [0,300];}
    get_transformed_size() {return [60,44];}
    set_pivot_point() {}
    ease(options) {this.transition=options;}
    remove_all_transitions() {this.transition=null;}
    destroy() {this.emit('destroy'); this.parent?.remove_child(this); this.dead=true;}
}
const clock=new Actor(), center=new Actor(), left=new Actor(), activities=new Actor();
center.add_child(clock); left.add_child(activities);
const group=new Actor(), dock=new Actor({name:'dashtodockContainer'}), button=new Actor(), unrelated=new Actor();
button.classes.add('show-apps'); unrelated.classes.add('show-apps');
dock.add_child(button); group.add_child(dock); group.add_child(unrelated);
const layout=new Actor(); layout.uiGroup=group;
const manager=new Actor(); let idle;
let centerCleanupCount=0;
const context={playBaguaRipple:function(){this._clearRings();for(let i=0;i<9;i++){const ring=new Actor({style:`border-color: #00000${i}`});ring.ease({onComplete:()=>{this._rings.delete(ring);ring.destroy();}});this._rings.add(ring);}},installRgbIndicator:()=>()=>{},installButtonAlignment:()=>()=>{},installScreenCenter:()=>()=>{centerCleanupCount++;},Main:{panel:{statusArea:{dateMenu:{container:clock},activities:{container:activities}},_leftBox:left,_centerBox:center},layoutManager:layout,extensionManager:manager,sessionMode:new Actor()},
    GLib:{PRIORITY_DEFAULT_IDLE:0,SOURCE_REMOVE:false,idle_add:(_p,fn)=>{idle=fn;return 1;},Source:{remove:()=>{idle=null;}}},
    St:{Widget:Actor},Clutter:{AnimationMode:{EASE_OUT_QUAD:1}},Extension:class {}};
vm.createContext(context);
const code=fs.readFileSync('extension/extension.js','utf8').replace(/^import .*;\n/gm,'').replace('export default class DesktopPolish','globalThis.DesktopPolish = class DesktopPolish');
vm.runInContext(code,context);
const extension=new context.DesktopPolish();
extension.enable(); idle();
assert.equal(clock.parent,left); assert.equal(left.children[0],clock); assert.equal(activities.parent,center);
// A session/layout rebuild must not leave the native order behind.
left.remove_child(clock); center.remove_child(activities);
center.add_child(clock); left.add_child(activities);
context.Main.sessionMode.emit('updated'); idle();
assert.equal(clock.parent,left);assert.equal(activities.parent,center);
assert(button.classes.has('archgpt-color-launcher')); assert(!unrelated.classes.has('archgpt-color-launcher'));
button.emit('clicked'); assert.equal(extension._rings.size,9);
assert.equal(new Set([...extension._rings].map(r=>r.style.match(/border-color: (#[0-9a-f]+)/)[1])).size,9);
const first=[...extension._rings]; button.emit('clicked');
assert(first.every(a=>a.dead)); assert.equal(extension._rings.size,9);
const rings=[...extension._rings]; rings.forEach(a=>a.transition.onComplete()); assert.equal(extension._rings.size,0);
button.emit('clicked'); extension.disable();
assert.equal(clock.parent,center); assert.equal(center.children[0],clock);
assert.equal(extension._rings.size,0); assert.equal(button.signals.size,0);
assert(!button.classes.has('archgpt-color-launcher')); assert.equal(manager.signals.size,0); assert.equal(layout.signals.size,0);assert.equal(context.Main.sessionMode.signals.size,0);
extension.enable(); idle(); button.destroy(); assert.equal(extension._buttons.size,0); extension.disable();
assert.equal(centerCleanupCount,2);
console.log('PASS: clock move/restore; scoped button styling; repeated click bound to 9 rings; animation cleanup; disable cleanup; destroyed button cleanup');
