// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 OpenGodAI contributors
// Ubuntu Dock keeps a list of candidate logical icon sizes. Extend its native
// space/count calculation with all integer sizes from 15 to the configured cap.
export function adaptiveSizes(maxSize, fixed = false) {
    const max = Math.min(52, Math.max(15, Math.floor(maxSize)));
    return fixed ? [max] : Array.from({length: max - 14}, (_, i) => i + 15);
}

export function adaptDash(dash) {
    if (typeof dash?._initializeIconSize !== 'function' ||
        !Array.isArray(dash._availableIconSizes))
        throw new Error('Unsupported Ubuntu Dock sizing API.');
    const original = dash._initializeIconSize;
    const wrapper = function (maxSize) {
        original.call(this, maxSize);
        this._availableIconSizes = adaptiveSizes(maxSize, this._availableIconSizes.length === 1);
    };
    dash._initializeIconSize = wrapper;
    const max = Math.max(...dash._availableIconSizes);
    wrapper.call(dash, max);
    dash._queueRedisplay();
    let active = true;
    return () => {
        if (!active)
            return;
        active = false;
        if (dash._initializeIconSize !== wrapper)
            return;
        dash._initializeIconSize = original;
        original.call(dash, Math.max(...dash._availableIconSizes));
        dash._queueRedisplay();
    };
}
