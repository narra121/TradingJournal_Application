import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';

interface RootStateAny { [k:string]: any }

export function LessonsWidget() {
  const trades = useSelector((s: RootStateAny)=> s.AwsTrades?.items || []);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const lessonStats = useMemo(()=> {
    const map = new Map<string, number>();
    for(const t of trades) {
      if(Array.isArray(t?.lessons)) {
        t.lessons.forEach((l:string) => {
          const key = (l||'').trim();
          if(!key) return;
          map.set(key, (map.get(key) || 0) + 1);
        });
      }
    }
    const arr = Array.from(map.entries()).map(([lesson, count])=>({ lesson, count }))
      .sort((a,b)=> b.count - a.count || a.lesson.localeCompare(b.lesson));
    return arr;
  }, [trades]);

  const filtered = useMemo(()=> {
    const q = query.trim().toLowerCase();
    if(!q) return lessonStats;
    return lessonStats.filter(l => l.lesson.toLowerCase().includes(q));
  }, [lessonStats, query]);

  const visible = showAll ? filtered : filtered.slice(0, 12);

  const exportText = filtered.map(l=> `• ${l.lesson} (${l.count})`).join('\n');

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(exportText || '');
    } catch {}
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className="text-sm font-medium">Lessons ({lessonStats.length})</CardTitle>
        </div>
        <div className='mt-2 flex gap-2'>
          <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder='Filter lessons...' className='h-8 text-xs' />
          <Button size='sm' variant='outline' onClick={copyAll} disabled={!lessonStats.length}>Copy</Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {lessonStats.length === 0 && (
          <div className='text-xs text-muted-foreground'>No lessons captured yet.</div>
        )}
        {lessonStats.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {visible.map(item => (
              <Badge key={item.lesson} variant='secondary' className='text-[10px] font-normal flex items-center gap-1 py-1 px-2'>
                <span>{item.lesson}</span>
                <span className='text-[9px] opacity-70'>×{item.count}</span>
              </Badge>
            ))}
          </div>
        )}
        {filtered.length > 12 && (
          <div className='pt-3'>
            <Button size='sm' variant='ghost' onClick={()=> setShowAll(s=>!s)} className='text-[11px] px-2'>
              {showAll ? 'Show Less' : `Show All (${filtered.length})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LessonsWidget;