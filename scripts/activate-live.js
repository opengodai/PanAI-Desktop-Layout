// User invokes this module in GNOME's Looking Glass; no unsafe-mode changes.
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {ExtensionType,ExtensionState} from 'resource:///org/gnome/shell/misc/extensionUtils.js';
import {installScreenCenter} from '../extension/screen-center.js';
import {installButtonAlignment} from '../extension/button-align.js';
const uuid='archgpt-desktop-polish@archgpt.local';
const manager=Main.extensionManager;
let extension=manager.lookup(uuid);
if(!extension){
    const dir=Gio.File.new_for_path(GLib.build_filenamev([GLib.get_user_data_dir(),'gnome-shell','extensions',uuid]));
    extension=manager.createExtensionObject(uuid,dir,ExtensionType.PER_USER);
    await manager.loadExtension(extension);
}
if(extension.state!==ExtensionState.ACTIVE)throw new Error(`扩展未启用，状态 ${extension.state}；请先运行 install.sh。`);
const state=extension.stateObj,clock=Main.panel.statusArea.dateMenu.container,activities=Main.panel.statusArea.activities.container;
if(!state._activities){
    state._activities=activities;state._activitiesParent=activities.get_parent();
    state._activitiesIndex=state._activitiesParent.get_children().indexOf(activities);
}
if(clock.get_parent()!==Main.panel._leftBox){clock.get_parent().remove_child(clock);Main.panel._leftBox.insert_child_at_index(clock,0);}
if(activities.get_parent()!==Main.panel._centerBox){activities.get_parent().remove_child(activities);Main.panel._centerBox.add_child(activities);}
state._buttonAlignmentCleanup?.();state._screenCenterCleanup?.();
state._screenCenterCleanup=installScreenCenter();state._buttonAlignmentCleanup=installButtonAlignment();
if(!state._panDesktopLiveWrapped){
    const originalDisable=state.disable.bind(state);
    state.disable=function(){
        this._buttonAlignmentCleanup?.();this._buttonAlignmentCleanup=null;
        this._screenCenterCleanup?.();this._screenCenterCleanup=null;
        if(this._activities?.get_parent()&&this._activitiesParent){
            this._activities.get_parent().remove_child(this._activities);
            this._activitiesParent.insert_child_at_index(this._activities,this._activitiesIndex);
        }
        originalDisable();
    };
    state._panDesktopLiveWrapped=true;
}
export const result='PanDesktop 当前会话布局已应用。';
