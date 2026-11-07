// Explicit user invocation in Looking Glass. No unsafe-mode changes or restart.
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {ExtensionType,ExtensionState} from 'resource:///org/gnome/shell/misc/extensionUtils.js';
const uuid='archgpt-desktop-polish@archgpt.local';
const dir=Gio.File.new_for_path(GLib.build_filenamev([GLib.get_user_data_dir(),'gnome-shell','extensions',uuid]));
const [ok,bytes]=dir.get_child('runtime.json').load_contents(null);
if(!ok)throw new Error('请先运行 install.sh 准备当前版本。');
const manifest=JSON.parse(new TextDecoder().decode(bytes));
if(manifest.format!==1||!/^[a-f0-9]{64}$/.test(manifest.sha256))throw new Error('无效的本地版本清单。');
const entry=dir.get_child(`runtime/${manifest.sha256}/extension.js`);
const {default:CurrentExtension}=await import(entry.get_uri());
const manager=Main.extensionManager;
let ext=manager.lookup(uuid);
if(!ext){ext=manager.createExtensionObject(uuid,dir,ExtensionType.PER_USER);await manager.loadExtension(ext);}
const previous=ext.stateObj;
if(ext.state===ExtensionState.ACTIVE)await manager._callExtensionDisable(uuid);
if(ext.state!==ExtensionState.INACTIVE && ext.state!==ExtensionState.INITIALIZED)
    throw new Error(`无法安全切换扩展，当前状态 ${ext.state}`);
try {
    ext.stateObj=new CurrentExtension({...ext.metadata,dir:ext.dir,path:ext.path});
    ext.state=ExtensionState.INACTIVE;
    await manager._callExtensionEnable(uuid);
    if(ext.state!==ExtensionState.ACTIVE)throw new Error('当前版本启用失败。');
} catch(error) {
    try{ext.stateObj.disable();}catch{/* bounded cleanup */}
    if(previous){ext.stateObj=previous;ext.state=ExtensionState.INACTIVE;await manager._callExtensionEnable(uuid);}
    throw error;
}
export const result=`PanAI Desktop Layout 已应用，版本 ${manifest.sha256.slice(0,12)}`;
