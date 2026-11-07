// Explicit Looking Glass repair: replace the cached state object with the current
// repository class. No unsafe-mode changes and no Shell/session restart.
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import DesktopPolish from '../extension/extension.js';
const uuid='archgpt-desktop-polish@archgpt.local';
const manager=Main.extensionManager, ext=manager.lookup(uuid);
if(ext?.state!==1)throw new Error('Expected existing active PanAI Desktop Layout extension.');
const previous=ext.stateObj;
await manager._callExtensionDisable(uuid);
if(ext.state!==2)throw new Error('Existing extension did not disable cleanly; stop.');
try {
    ext.stateObj=new DesktopPolish({...ext.metadata,dir:ext.dir,path:ext.path});
    await manager._callExtensionEnable(uuid);
    if(ext.state!==1)throw new Error('Replacement did not enable.');
    // Verify the same persistent enable path a session-mode cycle will use.
    await manager._callExtensionDisable(uuid);
    if(ext.state!==2)throw new Error('Replacement disable failed.');
    await manager._callExtensionEnable(uuid);
    if(ext.state!==1)throw new Error('Replacement re-enable failed.');
} catch(e) {
    if(ext.state===2){ext.stateObj=previous;await manager._callExtensionEnable(uuid);}
    throw e;
}
const geometry=a=>{const [x,y]=a.get_transformed_position();const [width,height]=a.get_transformed_size();return {x,y,width,height};};
let object;
const api={
    Inspect(){
        const state=ext.stateObj,button=Main.panel.statusArea.activities;
        const dots=button.get_first_child().get_children().filter(a=>a._dot&&!a.destroying);
        const active=dots.sort((a,b)=>b.expansion-a.expansion)[0];
        const bg=geometry(button),dot=active?geometry(active._dot):null;
        return JSON.stringify({state:ext.state,implementation:state.constructor.name,
            sessionRecoveryHook:!!state._sessionId,
            clockAtLeft:Main.panel.statusArea.dateMenu.container.get_parent()===Main.panel._leftBox,
            activitiesAtCenter:button.container.get_parent()===Main.panel._centerBox,
            clock:geometry(Main.panel.statusArea.dateMenu._clockDisplay),button:bg,dot,
            whiteOffset:dot?dot.x+dot.width/2-bg.x-bg.width/2:null});
    },
    Close(){object.unexport();return 'Closed';},
};
object=Gio.DBusExportedObject.wrapJSObject(`<node><interface name="net.archgpt.PanDesktopRepair"><method name="Inspect"><arg type="s" direction="out"/></method><method name="Close"><arg type="s" direction="out"/></method></interface></node>`,api);
object.export(Gio.DBus.session,'/net/archgpt/PanDesktopRepair');
export const result='REPLACED_AND_REENABLED: ready for live geometry verification';
