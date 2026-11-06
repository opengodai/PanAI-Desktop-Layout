const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync('extension/screen-center.js','utf8').replace(/^import .*;\n/gm,'').replace('export function installScreenCenter','function installScreenCenter')+'\nglobalThis.installScreenCenter=installScreenCenter;';
for (const test of [{x:0,width:1920,dockOffset:25},{x:0,width:1920,dockOffset:18.5},{x:-1600,width:1600,dockOffset:0},{x:1920,width:1536,dockOffset:-24}]) {
    let callback,connected=false,monitor={x:test.x,width:test.width};
    const box={connect(_n,fn){callback=fn;connected=true;return 1;},disconnect(){connected=false;}};
    let workOffset=test.dockOffset;
    const actor={translation_x:0,get_parent:()=>box,get_transformed_size:()=>[66,32],get_transformed_position(){return [monitor.x+monitor.width/2+workOffset-33+this.translation_x,0];}};
    const context={Main:{panel:{statusArea:{activities:{container:actor}},_centerBox:box},layoutManager:{findMonitorForActor:()=>monitor}}};
    vm.createContext(context);vm.runInContext(code,context);
    const cleanup=context.installScreenCenter();
    const error=()=>actor.get_transformed_position()[0]+33-(monitor.x+monitor.width/2);
    assert(Math.abs(error())<0.1);
    callback();assert(Math.abs(error())<0.1); // repeated allocations do not drift
    workOffset=40;monitor.width+=120;callback();assert(Math.abs(error())<0.1);
    cleanup();assert.equal(actor.translation_x,0);assert.equal(connected,false);cleanup();
}
console.log('PASS: screen midpoint independent of left/right Dock offset, fractional coordinates, multi-monitor origin; resize, no drift, cleanup');
