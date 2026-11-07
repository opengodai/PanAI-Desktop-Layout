// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// A single continuous pill, with the indicator's original thickness and fill.
export function playStarChain(holder, source, colors) {
    holder.clear();
    const [px,py]=Main.panel.get_transformed_position();
    const [pw,ph]=Main.panel.get_transformed_size();
    const [sx,sy]=source.get_transformed_position();
    const [sw,sh]=source.get_transformed_size();
    if(pw<=0||ph<=0||sw<=0||sh<=0)return;
    const layer=new St.Widget({x:px,y:py,width:pw,height:ph,
        clip_to_allocation:true,reactive:false,can_focus:false});
    const fill=source.get_style()??`background-color:rgb(${colors[0].join(',')});`;
    const bar=new St.Widget({x:sx-px,y:sy-py,width:sw,height:sh,
        opacity:200,reactive:false,can_focus:false,
        style:`${fill.replace(/;+$/,'')}; border-radius:999px; border:none; box-shadow:none;`});
    layer.add_child(bar);
    Main.layoutManager.uiGroup.add_child(layer);
    holder.actor=layer;
    bar.ease({x:0,width:pw,opacity:0,duration:5000,
        mode:Clutter.AnimationMode.EASE_OUT_CUBIC,
        onComplete:()=>{if(holder.actor===layer)holder.clear();}});
}
