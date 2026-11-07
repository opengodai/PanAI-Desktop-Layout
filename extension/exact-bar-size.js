// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Native WorkspaceDot rounds its preferred width. Set the multiplier from the
// measured dot width so the final active bar is exactly 81 logical pixels.
export function installExactBarSize() {
    const content=Main.panel.statusArea.activities.get_first_child();
    const records=[];
    for(const actor of content.get_children()){
        if(!actor._dot)continue;
        const original=actor.widthMultiplier;
        const sync=()=>{
            const [,natural]=actor._dot.get_preferred_width(-1);
            if(natural<=0)return;
            const factor=81/natural;
            if(Math.abs(actor.widthMultiplier-factor)>.00001)
                actor.widthMultiplier=factor;
        };
        const a=actor.connect('notify::width-multiplier',sync);
        const b=actor._dot.connect('style-changed',sync);
        sync();records.push([actor,a,b,original]);
    }
    let active=true;
    return ()=>{
        if(!active)return;active=false;
        for(const [actor,a,b,original]of records){
            try{actor.disconnect(a);actor._dot.disconnect(b);actor.widthMultiplier=original;}catch{}
        }
    };
}
