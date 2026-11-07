import GLib from 'gi://GLib';
import {COLOR_STOPS} from './rgb-indicator.js';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export function installTitleBurst() {
    const button=Main.panel.statusArea.activities;
    const content=button.get_first_child();
    const gesture=button._clickGesture;
    const previousOpacity=content.opacity > 0 ? content.opacity : 255;
    let layer=null,timer=0;
    const clear=()=>{
        if(timer){GLib.Source.remove(timer);timer=0;}
        if(layer){layer.destroy();layer=null;}
        content.opacity=previousOpacity;
    };
    const click=()=>{
        clear();
        const [px,py]=Main.panel.get_transformed_position();
        const [pw,ph]=Main.panel.get_transformed_size();
        layer=new St.Widget({x:px,y:py,width:pw,height:ph,clip_to_allocation:true,reactive:false,can_focus:false});
        Main.layoutManager.uiGroup.add_child(layer);
        const text='PanAI for Arch-GPT',cell=8;
        const start=(pw-text.length*cell)/2;
        const chars=[...text].map((letter,i)=>{
            const label=new St.Label({text:letter,x:start+i*cell,y:Math.max(0,(ph-18)/2),
                style:`font-family:monospace; font-size:13px; font-weight:600; color:rgb(${COLOR_STOPS[i % COLOR_STOPS.length].join(',')});`,
                reactive:false,can_focus:false});
            layer.add_child(label);return label;
        });
        content.opacity=0;
        timer=GLib.idle_add(GLib.PRIORITY_DEFAULT,()=>{
            timer=0;
            content.opacity=previousOpacity;
            const current=layer;let remaining=chars.length;
            chars.forEach((label,i)=>{
                const side=i<(chars.length-1)/2?-1:1;
                const fraction=Math.abs(i-(chars.length-1)/2)/((chars.length-1)/2);
                const destination=side<0 ? (1-fraction)*pw*.35 : pw*.65+fraction*(pw*.35-cell);
                label.ease({x:destination,opacity:0,duration:1500,
                    mode:Clutter.AnimationMode.EASE_OUT_CUBIC,
                    onComplete:()=>{remaining--;if(!remaining&&layer===current)clear();}});
            });
            return GLib.SOURCE_REMOVE;
        });
    };
    const id=gesture.connect('recognize',click);
    let active=true;
    const cleanup=()=>{if(!active)return;active=false;gesture.disconnect(id);clear();};
    cleanup.preview=click;
    cleanup.inspect=()=>({phase:timer?'title':layer?'dispersing':'idle',
        labelCount:layer?.get_children().length??0,contentOpacity:content.opacity});
    return cleanup;
}
