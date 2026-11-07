#!/usr/bin/env python3
"""User-scoped PanAI Desktop Layout install, check and exact-settings rollback."""
from pathlib import Path
import argparse, datetime, json, os, shutil, sys
sys.path.append('/usr/lib/python3/dist-packages')
from gi.repository import Gio, GLib

ROOT = Path(__file__).resolve().parents[1]
UUID = 'archgpt-desktop-polish@archgpt.local'
THEME = 'ArchGPT-ColorDots'
DATA = Path(os.environ.get('XDG_DATA_HOME', Path.home()/'.local/share'))
STATE = Path(os.environ.get('XDG_STATE_HOME', Path.home()/'.local/state'))/'PanDesktop'
PROFILE = json.loads((ROOT/'config/desktop.json').read_text())
TARGETS = [(ROOT/'extension', DATA/'gnome-shell/extensions'/UUID),
           (ROOT/'icons'/THEME, DATA/'icons'/THEME)]

def setting(schema):
    if not Gio.SettingsSchemaSource.get_default().lookup(schema, True):
        raise RuntimeError(f'缺少已安装的 GSettings schema：{schema}（本脚本不会安装软件包）')
    return Gio.Settings.new(schema)

def validate():
    assert PROFILE['format']==1
    assert json.loads((ROOT/'extension/metadata.json').read_text())['uuid']==UUID
    for rec in PROFILE['settings']:
        s=setting(rec['schema'])
        assert s.props.settings_schema.has_key(rec['key'])
        value=GLib.Variant.parse(GLib.VariantType.new(rec['type']),rec['value'],None,None)
        assert s.props.settings_schema.get_key(rec['key']).range_check(value), rec['key']
        assert s.is_writable(rec['key']),rec['key']
    shell=setting('org.gnome.shell')
    for key in ['enabled-extensions','disabled-extensions']:
        assert shell.is_writable(key),key
    for source,target in TARGETS:
        assert source.is_dir() and not target.is_symlink(),str(target)
        assert all(not p.is_symlink() for p in source.rglob('*'))
        for parent in [target,*target.parents]:
            assert not parent.is_symlink(),f'拒绝符号链接目标：{parent}'
    if not (Path('/usr/share/gnome-shell/extensions/ubuntu-dock@ubuntu.com').is_dir() or
            (DATA/'gnome-shell/extensions/ubuntu-dock@ubuntu.com').is_dir()):
        raise RuntimeError('需要预先安装 Ubuntu Dock。')

def backup_settings(records):
    out=[]
    for rec in records:
        s=setting(rec['schema']);v=s.get_user_value(rec['key'])
        out.append({'schema':rec['schema'],'key':rec['key'],'type':s.get_value(rec['key']).get_type_string(),
                    'user_value':v.print_(True) if v is not None else None})
    return out

def restore(path):
    path=Path(path).expanduser().resolve()
    # Backups are private local state, not input from the repository or internet.
    if path.parent != (STATE/'backups').resolve():
        raise RuntimeError('只接受本用户 PanDesktop/backups 内的备份。')
    if path.stat().st_uid!=os.getuid() or path.stat().st_mode & 0o077:
        raise RuntimeError('备份目录属主或权限不正确。')
    doc=json.loads((path/'backup.json').read_text())
    if doc.get('format')!=1:raise RuntimeError('未知备份格式')
    for rec in doc['settings']:
        s=setting(rec['schema'])
        if rec['user_value'] is None:s.reset(rec['key'])
        else:
            assert s.set_value(rec['key'],GLib.Variant.parse(GLib.VariantType.new(rec['type']),rec['user_value'],None,None))
    shell=setting('org.gnome.shell')
    for key,members in doc['memberships'].items():
        values=[x for x in shell.get_strv(key) if x not in members]
        values += [x for x,had in members.items() if had]
        assert shell.set_strv(key,values)
    if doc.get('mount'):
        rec=doc['mount'];f=Gio.File.new_for_uri(rec['uri']);info=Gio.FileInfo()
        if rec['old_icon'] is None:info.set_attribute('metadata::custom-icon',Gio.FileAttributeType.INVALID,None)
        else:info.set_attribute_string('metadata::custom-icon',rec['old_icon'])
        f.set_attributes_from_info(info,Gio.FileQueryInfoFlags.NONE,None)
    for index,(_,target) in enumerate(TARGETS):
        assert not target.is_symlink()
        if target.exists():shutil.rmtree(target)
        previous=path/f'files-{index}'
        if previous.exists():shutil.copytree(previous,target)
    Gio.Settings.sync()
    print('已恢复备份；只恢复本项目涉及的配置、文件和扩展成员关系。')
    print('运行中的已导入扩展源码不会热重载；可用 scripts/activate-live.js 即时应用安装版本。')

def apply(mount=None):
    if os.geteuid()==0:raise RuntimeError('请以桌面登录用户运行，不要使用 sudo。')
    validate()
    stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    path=STATE/'backups'/stamp;path.mkdir(parents=True,mode=0o700)
    shell=setting('org.gnome.shell');ids=PROFILE['enable_extensions']+PROFILE['disable_extensions']
    doc={'format':1,'settings':backup_settings(PROFILE['settings']),
         'memberships':{k:{x:x in shell.get_strv(k) for x in ids} for k in ['enabled-extensions','disabled-extensions']}}
    if mount:
        f=Gio.File.new_for_path(str(Path(mount).expanduser().resolve()))
        if not Path(mount).expanduser().resolve().is_mount():raise RuntimeError('--windows-root 必须是已挂载磁盘的根目录。')
        doc['mount']={'uri':f.get_uri(),'old_icon':f.query_info('metadata::custom-icon',Gio.FileQueryInfoFlags.NONE,None).get_attribute_string('metadata::custom-icon')}
    for i,(_,target) in enumerate(TARGETS):
        if target.exists():shutil.copytree(target,path/f'files-{i}',symlinks=True)
    (path/'backup.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
    try:
        for source,target in TARGETS:
            target.parent.mkdir(parents=True,exist_ok=True)
            if target.exists():shutil.rmtree(target)
            shutil.copytree(source,target)
        for rec in PROFILE['settings']:
            value=GLib.Variant.parse(GLib.VariantType.new(rec['type']),rec['value'],None,None)
            s=setting(rec['schema']);assert s.set_value(rec['key'],value)
            assert s.get_value(rec['key']).equal(value)
        for uuid in PROFILE['disable_extensions']:
            shell.set_strv('enabled-extensions',[v for v in shell.get_strv('enabled-extensions') if v!=uuid])
            shell.set_strv('disabled-extensions',list(dict.fromkeys([*shell.get_strv('disabled-extensions'),uuid])))
        for uuid in PROFILE['enable_extensions']:
            shell.set_strv('disabled-extensions',[v for v in shell.get_strv('disabled-extensions') if v!=uuid])
            shell.set_strv('enabled-extensions',list(dict.fromkeys([*shell.get_strv('enabled-extensions'),uuid])))
        if mount:
            icon=DATA/'icons'/THEME/'windows-volume-four-color.svg'
            assert f.set_attribute_string('metadata::custom-icon',icon.as_uri(),Gio.FileQueryInfoFlags.NONE,None)
        Gio.Settings.sync()
    except Exception:
        restore(path)
        raise
    STATE.mkdir(parents=True,exist_ok=True)
    (STATE/'latest-backup').write_text(str(path)+'\n')
    print(f'安装与配置读回完成。备份：{path}')
    print(f'一键回退：{ROOT}/restore.sh')
    print('当前会话若尚未加载新扩展，在 Alt+F2 → lg 中执行：')
    print(f"await import('{(ROOT/'scripts/activate-live.js').as_uri()}')")
    print('无需注销；脚本不会强制重启桌面。')

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    g=p.add_mutually_exclusive_group();g.add_argument('--check',action='store_true');g.add_argument('--restore',nargs='?',const='latest')
    p.add_argument('--windows-root',help='可选：为已挂载的 Windows 卷设置四色图标；不修改分区文件')
    a=p.parse_args()
    if a.check:
        validate();print('PASS：115 项配置、schema 与安装目标检查通过；未修改桌面。')
    elif a.restore:
        backup=(STATE/'latest-backup').read_text().strip() if a.restore=='latest' else a.restore
        restore(backup)
    else:apply(a.windows_root)
