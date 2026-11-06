"""Round-trip installer with memory GSettings and isolated user data paths."""
import os, runpy, tempfile, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
(root/'.local').mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(dir=root/'.local',prefix='install-test-') as tmp:
    os.environ['GSETTINGS_BACKEND']='memory'
    os.environ['XDG_DATA_HOME']=str(Path(tmp)/'data')
    os.environ['XDG_STATE_HOME']=str(Path(tmp)/'state')
    api=runpy.run_path(str(root/'scripts/configure.py'),run_name='panddesktop_test')
    Gio=api['Gio'];setting=api['setting']
    dock=setting('org.gnome.shell.extensions.dash-to-dock');dock.set_int('dash-max-icon-size',42)
    clock=setting('org.gnome.desktop.interface');clock.set_boolean('clock-show-seconds',False)
    shell=setting('org.gnome.shell');shell.set_strv('enabled-extensions',['keep@example.invalid'])
    for _,target in api['TARGETS']:
        target.mkdir(parents=True);(target/'original.txt').write_text('preserve original namespace')
    api['apply']()
    assert dock.get_int('dash-max-icon-size')==28
    assert clock.get_boolean('clock-show-seconds')
    assert 'keep@example.invalid' in shell.get_strv('enabled-extensions')
    for _,target in api['TARGETS']:assert not (target/'original.txt').exists()
    backup=(api['STATE']/'latest-backup').read_text().strip()
    api['restore'](backup)
    assert dock.get_int('dash-max-icon-size')==42
    assert not clock.get_boolean('clock-show-seconds')
    assert shell.get_strv('enabled-extensions')==['keep@example.invalid']
    for _,target in api['TARGETS']:assert (target/'original.txt').read_text()=='preserve original namespace'
print('PASS: isolated install/readback/rollback; existing files/settings and unrelated extensions preserved')
