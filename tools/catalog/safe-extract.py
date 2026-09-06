"""Bounded, no-links ZIP extraction. Validate entire central directory before any writes.
Destination must not exist. Never overwrites a user's existing library.
"""
import sys, zipfile, pathlib, stat, json
MAX_FILES=100000
MAX_TOTAL=2_000_000_000
MAX_FILE=64_000_000

def extract(archive, dest):
    dest=pathlib.Path(dest)
    if dest.exists(): raise ValueError('DESTINATION_EXISTS')
    if pathlib.Path(archive).stat().st_size>512_000_000: raise ValueError('ARCHIVE_BUDGET')
    with zipfile.ZipFile(archive) as z:
        entries=z.infolist()
        if len(entries)>MAX_FILES: raise ValueError('FILE_COUNT_BUDGET')
        total=0; seen=set()
        for e in entries:
            name=e.filename
            p=pathlib.PurePosixPath(name)
            if not name or '\\' in name or ':' in name or '\x00' in name or p.is_absolute() or '..' in p.parts or '.' in name.split('/') or len(name)>512:
                raise ValueError('UNSAFE_ARCHIVE_PATH: '+name)
            key=name.rstrip('/').lower()
            if key in seen: raise ValueError('DUPLICATE_ARCHIVE_PATH: '+name)
            seen.add(key)
            mode=e.external_attr>>16
            if stat.S_IFMT(mode) not in (0,stat.S_IFREG,stat.S_IFDIR): raise ValueError('ARCHIVE_LINK_OR_SPECIAL: '+name)
            if e.flag_bits & 1: raise ValueError('ENCRYPTED_ARCHIVE')
            total+=e.file_size
            if total>MAX_TOTAL or e.file_size>MAX_FILE or e.file_size>max(1,e.compress_size)*1000: raise ValueError('ZIP_BOMB_BUDGET')
        dest.mkdir(parents=True)
        written=0
        for e in entries:
            target=dest.joinpath(*pathlib.PurePosixPath(e.filename).parts)
            if e.is_dir(): target.mkdir(parents=True,exist_ok=True); continue
            target.parent.mkdir(parents=True,exist_ok=True)
            count=0
            with z.open(e) as src, target.open('xb') as out:
                while True:
                    buf=src.read(1024*1024)
                    if not buf: break
                    count+=len(buf); written+=len(buf)
                    if count>e.file_size or count>MAX_FILE or written>MAX_TOTAL: raise ValueError('EXPANSION_BUDGET')
                    out.write(buf)
            if count!=e.file_size: raise ValueError('TRUNCATED_ARCHIVE')
        return {'files':len(entries),'expandedBytes':written}
if __name__=='__main__':
    try: print(json.dumps(extract(sys.argv[1],sys.argv[2])))
    except Exception as e: print(str(e),file=sys.stderr); sys.exit(2)
