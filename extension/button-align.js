import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export function installButtonAlignment() {
    const button = Main.panel.statusArea.activities;
    const indicators = button.get_first_child();
    const clock = Main.panel.statusArea.dateMenu;
    const label = clock._clockDisplay;
    if (!indicators || !label)
        throw new Error('Expected GNOME activities and clock actors are unavailable.');
    const originalX = indicators.translation_x;
    const originalClockStyle = clock.get_style();
    const originalLabelStyle = label.get_style();
    const originalNaturalPadding = clock._natHPadding;
    const originalMinimumPadding = clock._minHPadding;
    const cleanStyle = value => (value ?? '').split(';').map(v => v.trim()).filter(Boolean).join('; ');
    const clockStyle = cleanStyle(originalClockStyle);
    const labelStyle = cleanStyle(originalLabelStyle);
    const zeroClockPadding = () => {
        clock._natHPadding = 0;
        clock._minHPadding = 0;
        clock.queue_relayout?.();
    };
    const align = () => {
        // Keep inactive workspace indicators and all native interactions intact.
        // The active white capsule, rather than its trailing workspace slot,
        // is what must be centered within the hover button.
        const active = indicators.get_children().filter(a => a._dot && !a.destroying)
            .sort((a, b) => b.expansion - a.expansion)[0];
        if (!active || active.expansion < 0.99)
            return;
        const [bx] = button.get_transformed_position();
        const [bw] = button.get_transformed_size();
        const [dx] = active._dot.get_transformed_position();
        const [dw] = active._dot.get_transformed_size();
        if (bw <= 0 || dw <= 0)
            return;
        const delta = bx + bw / 2 - (dx + dw / 2);
        if (Math.abs(delta) > 0.1)
            indicators.translation_x += delta;
    };
    const buttonId = button.connect('notify::allocation', align);
    const contentId = indicators.connect('notify::allocation', align);
    const styleId = clock.connect('style-changed', zeroClockPadding);
    clock.set_style(`${clockStyle ? clockStyle + '; ' : ''}-natural-hpadding: 0px; -minimum-hpadding: 0px;`);
    label.set_style(`${labelStyle ? labelStyle + '; ' : ''}padding-left: 0px;`);
    zeroClockPadding();
    align();
    let connected = true;
    return () => {
        if (!connected)
            return;
        connected = false;
        button.disconnect(buttonId);
        indicators.disconnect(contentId);
        clock.disconnect(styleId);
        indicators.translation_x = originalX;
        clock.set_style(originalClockStyle);
        label.set_style(originalLabelStyle);
        clock._natHPadding = originalNaturalPadding;
        clock._minHPadding = originalMinimumPadding;
        clock.queue_relayout?.();
    };
}
