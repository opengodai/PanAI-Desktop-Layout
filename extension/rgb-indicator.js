// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
import GLib from 'gi://GLib';
import {playStarChain} from './star-chain.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Twelve explicit color stops, smoothly interpolated; one cycle is 5 seconds.
export const COLOR_STOPS = [
    [255,65,65], [255,140,40], [255,210,40], [190,245,40],
    [65,220,90], [40,220,165], [40,210,245], [45,145,255],
    [85,85,255], [155,70,245], [220,60,225], [255,65,150],
];
export function spectrumRgb(turn) {
    const position = ((turn % 1) + 1) % 1 * COLOR_STOPS.length;
    const index = Math.floor(position);
    const mix = position - index;
    const a = COLOR_STOPS[index];
    const b = COLOR_STOPS[(index + 1) % COLOR_STOPS.length];
    return a.map((c,i) => Math.round(c + (b[i] - c) * mix));
}

export function installRgbIndicator({clickEffect = true} = {}) {
    const button = Main.panel.statusArea.activities;
    const content = button.get_first_child();
    const gesture=button._clickGesture;
    if(!gesture?.connect)throw new Error('Native workspace click gesture is unavailable.');
    const stars={actor:null,clear(){if(this.actor){this.actor.destroy();this.actor=null;}}};
    const clickId=clickEffect ? gesture.connect('recognize',()=>{
        const active=content.get_children().filter(a=>a._dot&&!a.destroying)
            .sort((a,b)=>b.expansion-a.expansion)[0];
        if(active)playStarChain(stars,active._dot,COLOR_STOPS);
    }) : 0;
    const originals = new Map();
    const started = GLib.get_monotonic_time();
    const tick = () => {
        if (Main.sessionMode.isLocked || Main.sessionMode.isGreeter)
            return GLib.SOURCE_CONTINUE;
        const elapsed = (GLib.get_monotonic_time() - started) / 1e6;
        const turn = elapsed / 5;
        const brightness = 0.65 + 0.35 * (0.5 + 0.5 * Math.cos(turn * 2 * Math.PI));
        const color = spectrumRgb(turn).map(c => Math.round(c * brightness)).join(',');
        for (const actor of content.get_children()) {
            if (!actor._dot || actor.destroying)
                continue;
            const dot = actor._dot;
            if (!originals.has(dot)) originals.set(dot, dot.get_style());
            // Only the background fill changes; size and native opacity remain.
            const original = originals.get(dot)?.trim().replace(/;+$/, '') ?? '';
            dot.set_style(`${original ? original + '; ' : ''}background-color: rgb(${color});`);
        }
        return GLib.SOURCE_CONTINUE;
    };
    tick();
    const timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 33, tick);
    let running = true;
    return () => {
        if (!running) return;
        running = false;
        GLib.Source.remove(timer);
        if(clickId)gesture.disconnect(clickId);
        stars.clear();
        for (const [dot, style] of originals) {
            // A workspace may have been removed while the extension was active.
            try { if (dot.get_stage()) dot.set_style(style); } catch { /* destroyed */ }
        }
        originals.clear();
    };
}
