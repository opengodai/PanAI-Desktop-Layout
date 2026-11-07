// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// The stock center box follows the work area, which is shifted by a left Dock.
// Translate only the activities actor to the monitor's actual midpoint.
export function installScreenCenter() {
    const actor = Main.panel.statusArea.activities.container;
    const box = Main.panel._centerBox;
    if (actor.get_parent() !== box)
        throw new Error('Workspace indicator must be in the center box first.');
    const originalX = actor.translation_x;
    const align = () => {
        const monitor = Main.layoutManager.findMonitorForActor(Main.panel);
        const [x] = actor.get_transformed_position();
        const [width] = actor.get_transformed_size();
        if (!monitor || width <= 0)
            return;
        const delta = monitor.x + monitor.width / 2 - (x + width / 2);
        if (Math.abs(delta) > 0.1)
            actor.translation_x += delta;
    };
    const id = box.connect('notify::allocation', align);
    align();
    let connected = true;
    return () => {
        if (!connected)
            return;
        connected = false;
        box.disconnect(id);
        actor.translation_x = originalX;
    };
}
