import GLib from 'gi://GLib';
import {installScreenCenter} from './screen-center.js';
import {installButtonAlignment} from './button-align.js';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class DesktopPolish extends Extension {
    enable() {
        this._buttons = new Map();
        this._rings = new Set();
        this._clock = Main.panel.statusArea.dateMenu.container;
        this._clockParent = this._clock.get_parent();
        this._clockIndex = this._clockParent.get_children().indexOf(this._clock);
        this._clockParent.remove_child(this._clock);
        Main.panel._leftBox.add_child(this._clock);
        this._activities = Main.panel.statusArea.activities.container;
        this._activitiesParent = this._activities.get_parent();
        this._activitiesIndex = this._activitiesParent.get_children().indexOf(this._activities);
        this._activitiesParent.remove_child(this._activities);
        Main.panel._centerBox.add_child(this._activities);
        this._screenCenterCleanup = installScreenCenter();
        this._buttonAlignmentCleanup = installButtonAlignment();
        this._extensionsId = Main.extensionManager.connect('extension-state-changed',
            () => this._queueBind());
        this._monitorsId = Main.layoutManager.connect('monitors-changed',
            () => this._queueBind());
        this._queueBind();
    }

    _queueBind() {
        if (this._idle)
            return;
        this._idle = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._idle = 0;
            this._bindDockButtons(Main.layoutManager.uiGroup, false);
            return GLib.SOURCE_REMOVE;
        });
    }

    _bindDockButtons(actor, inDock) {
        inDock ||= actor.name === 'dashtodockContainer';
        if (inDock && actor.has_style_class_name?.('show-apps') &&
            !this._buttons.has(actor)) {
            actor.add_style_class_name('archgpt-color-launcher');
            const clicked = actor.connect('clicked', () => this._play(actor));
            const destroyed = actor.connect('destroy', () => this._buttons.delete(actor));
            this._buttons.set(actor, [clicked, destroyed]);
        }
        for (const child of actor.get_children())
            this._bindDockButtons(child, inDock);
    }

    _play(button) {
        // Repeated clicks restart the effect instead of accumulating actors.
        this._clearRings();
        const [x, y] = button.get_transformed_position();
        const [w, h] = button.get_transformed_size();
        ['#49c9f2', '#a56de2', '#ff9d00'].forEach((color, i) => {
            const ring = new St.Widget({
                style_class: 'archgpt-launcher-ripple',
                style: `border-color: ${color};`,
                reactive: false,
                can_focus: false,
                width: 64,
                height: 64,
                x: x + w / 2 - 32,
                y: y + h / 2 - 32,
                opacity: 210,
                scale_x: 0.3,
                scale_y: 0.3,
            });
            ring.set_pivot_point(0.5, 0.5);
            Main.layoutManager.uiGroup.add_child(ring);
            this._rings.add(ring);
            ring.ease({
                scale_x: 1.3 - i * 0.12,
                scale_y: 1.3 - i * 0.12,
                opacity: 0,
                duration: 550,
                delay: i * 70,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    this._rings.delete(ring);
                    ring.destroy();
                },
            });
        });
    }

    _clearRings() {
        for (const ring of this._rings) {
            ring.remove_all_transitions();
            ring.destroy();
        }
        this._rings.clear();
    }

    disable() {
        this._buttonAlignmentCleanup?.();
        this._buttonAlignmentCleanup = null;
        this._screenCenterCleanup?.();
        this._screenCenterCleanup = null;
        if (this._idle) {
            GLib.Source.remove(this._idle);
            this._idle = 0;
        }
        Main.extensionManager.disconnect(this._extensionsId);
        Main.layoutManager.disconnect(this._monitorsId);
        for (const [button, ids] of this._buttons) {
            ids.forEach(id => button.disconnect(id));
            button.remove_style_class_name('archgpt-color-launcher');
        }
        this._buttons.clear();
        this._clearRings();
        if (this._clock?.get_parent() && this._clockParent) {
            this._clock.get_parent().remove_child(this._clock);
            this._clockParent.insert_child_at_index(this._clock, this._clockIndex);
        }
        if (this._activities?.get_parent() && this._activitiesParent) {
            this._activities.get_parent().remove_child(this._activities);
            this._activitiesParent.insert_child_at_index(this._activities, this._activitiesIndex);
        }
        this._activities = this._activitiesParent = null;
        this._clock = this._clockParent = null;
    }
}
