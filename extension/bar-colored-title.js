// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {installRgbIndicator} from './rgb-indicator.js';
import {installTitleBurst} from './title-burst.js';
import {installScreenCenter} from './screen-center.js';
import {installButtonAlignment} from './button-align.js';

export function installBarColoredTitle() {
    const button=Main.panel.statusArea.activities;
    const previous=button.get_first_child();
    if(!previous)throw new Error('Native activities content is unavailable.');
    // Preserve native workspace state and native button gestures, but never
    // use animated WorkspaceDot geometry for the fixed-size visual.
    const pill=new St.Widget({width:81,height:13,reactive:false,can_focus:false,
        style_class:'panai-status-pill',style:'border-radius:999px; background-color:white;'});
    const content=new St.Bin({child:pill,x_align:Clutter.ActorAlign.CENTER,y_align:Clutter.ActorAlign.CENTER});
    // Adapt the shared color/alignment helpers to this one stable visual.
    pill._dot=pill;pill.expansion=1;
    button.remove_child(previous);button.add_child(content);
    const stops=[];
    try {
        stops.push(installRgbIndicator({clickEffect:false}));
        stops.push(installButtonAlignment());
        stops.push(installScreenCenter());
        stops.push(installTitleBurst());
    } catch(error) {
        for(const stop of stops.reverse())stop();
        button.remove_child(content);content.destroy();button.add_child(previous);
        throw error;
    }
    let active=true;
    const cleanup=()=>{
        if(!active)return;active=false;
        for(const stop of [...stops].reverse())stop();
        button.remove_child(content);content.destroy();button.add_child(previous);
    };
    cleanup.preview=()=>stops[3].preview();
    cleanup.inspect=()=>({...stops[3].inspect(),defaultMode:'independent 81x13 bar',clickTitle:'PanAI for Arch-GPT'});
    return cleanup;
}
