// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Dense dotted trigrams and taiji. Density is independent of launcher icon dots.
export function baguaPoints() {
    const points=[];
    for(let trigram=0;trigram<8;trigram++){
        const angle=-Math.PI/2+trigram*Math.PI/4;
        for(let line=0;line<3;line++){
            const radius=48+line*8;
            const offsets=(trigram>>line)&1?[-12,-8,-4,0,4,8,12]:[-12,-8,-4,4,8,12];
            for(const offset of offsets)points.push({x:Math.cos(angle)*radius-Math.sin(angle)*offset,
                y:Math.sin(angle)*radius+Math.cos(angle)*offset,part:'trigram'});
        }
    }
    for(let i=0;i<48;i++){
        const angle=i*2*Math.PI/48;
        points.push({x:Math.cos(angle)*23,y:Math.sin(angle)*23,part:'taiji'});
    }
    for(let i=0;i<25;i++){
        const y=-17+i*34/24;
        points.push({x:9*Math.sin(y/17*Math.PI),y,part:'taiji'});
    }
    points.push({x:0,y:-11,part:'taiji'},{x:0,y:11,part:'taiji'});
    return points;
}

export function dotColor(i) {
    const h=((i*.618033988749895)%1)*6,x=1-Math.abs(h%2-1);
    const c=h<1?[1,x,0]:h<2?[x,1,0]:h<3?[0,1,x]:h<4?[0,x,1]:h<5?[x,0,1]:[1,0,x];
    return c.map(v=>Math.round(65+190*v));
}

export function playBaguaRipple(button) {
    this._clearRings();
    const [x,y]=button.get_transformed_position(),[w,h]=button.get_transformed_size();
    const size=160;
    // Pixel content is painted once. Only the actor's compositor transforms
    // change during the animation; no per-dot actors or layout transitions.
    const canvas=new St.DrawingArea({x:x+w/2-size/2,y:y+h/2-size/2,
        width:size,height:size,opacity:240,reactive:false,can_focus:false,
        scale_x:.035,scale_y:.035});
    canvas.set_pivot_point(.5,.5);
    canvas.connect('repaint',area=>{
        const cr=area.get_context();
        try {
            for(const [i,point]of baguaPoints().entries()){
                const color=dotColor(i);
                cr.setSourceRGBA(color[0]/255,color[1]/255,color[2]/255,1);
                cr.arc(size/2+point.x,size/2+point.y,point.part==='taiji'?1.5:1.75,0,Math.PI*2);
                cr.fill();
            }
        } finally {cr.$dispose();}
    });
    Main.layoutManager.uiGroup.add_child(canvas);this._rings.add(canvas);
    canvas.queue_repaint();
    canvas.ease({scale_x:1,scale_y:1,duration:650,
        mode:Clutter.AnimationMode.EASE_OUT_CUBIC,
        onComplete:()=>{
            if(!this._rings.has(canvas))return;
            canvas.ease({scale_x:1.2,scale_y:1.2,opacity:0,delay:250,duration:850,
                mode:Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete:()=>{this._rings.delete(canvas);canvas.destroy();}});
        }});
}
