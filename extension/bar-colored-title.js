import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {installExactBarSize} from './exact-bar-size.js';
import {installRgbIndicator} from './rgb-indicator.js';
import {installTitleBurst} from './title-burst.js';
import {installScreenCenter} from './screen-center.js';
import {installButtonAlignment} from './button-align.js';

export function installBarColoredTitle() {
    const button=Main.panel.statusArea.activities;
    const saved=new Map();
    for(const actor of button.get_first_child().get_children()){
        if(!actor._dot||actor.destroying)continue;
        const dot=actor._dot;const style=dot.get_style();saved.set(dot,style);
        const clean=(style??'').trim().replace(/;+$/,'');
        dot.set_style(`${clean?clean+'; ':''}min-width:22.35px; min-height:13px;`);
    }
    const stopColor=installRgbIndicator({clickEffect:false});
    const stopSize=installExactBarSize();
    const stopAlign=installButtonAlignment();
    const stopCenter=installScreenCenter();
    const stopTitle=installTitleBurst();
    let active=true;
    const cleanup=()=>{
        if(!active)return;active=false;
        stopTitle();stopCenter();stopAlign();stopSize();stopColor();
        for(const [dot,style]of saved){try{if(dot.get_stage())dot.set_style(style);}catch{}}
        saved.clear();
    };
    cleanup.preview=()=>stopTitle.preview();
    cleanup.inspect=()=>({...stopTitle.inspect(),defaultMode:'colored bar',clickTitle:'PanAI for Arch-GPT'});
    return cleanup;
}
