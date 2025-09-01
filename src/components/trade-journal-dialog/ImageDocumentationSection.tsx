import { Upload, Trash2, Plus, Pencil, Image as ImageIcon } from "lucide-react";
import { useState, Dispatch, SetStateAction, ClipboardEvent } from 'react'
import { ImageType } from "@/app/types";
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';

interface ImageDocumentationSectionProps {
  images: ImageType[];
  setImages: Dispatch<SetStateAction<ImageType[]>>;
  onDirty: () => void;
}

export function ImageDocumentationSection({ images, setImages, onDirty }: ImageDocumentationSectionProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const timeframeOptions = ['1m','5m','15m','30m','1H','4H','Daily','Weekly']
  const MAX_IMAGES = 10

  const addBlankImage = () => {
    setImages(prev => {
      if(prev.length >= MAX_IMAGES) return prev;
      const created = { id: crypto.randomUUID(), url: '', timeframe: '', description: '' }
      const next = [created, ...prev];
      setEditingIndex(0)
      onDirty()
      return next
    })
  }

  const handleFileSelectForIndex = async (file: File, idx: number) => {
    if(!file) return;
    setIsUploading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
  updateImageField(idx, 'url', base64)
    } finally {
      setIsUploading(false)
    }
  }

  const onPasteAny = (e: ClipboardEvent<any>) => {
    // If an image is in clipboard, capture it
    if(e.clipboardData && e.clipboardData.items) {
      for(const item of e.clipboardData.items) {
        if(item.type.startsWith('image/')) {
          const file = item.getAsFile();
            if(file) {
              e.preventDefault();
              // If we have an editing index use it; else add new blank image first
              let targetIdx = editingIndex;
              if(targetIdx === null) {
                setImages(prev => {
                  const next = [...prev, { id: crypto.randomUUID(), url: '', timeframe: '', description: '' }];
                  targetIdx = next.length - 1;
                  setEditingIndex(targetIdx);
                  return next;
                })
              }
              if(targetIdx !== null) void handleFileSelectForIndex(file, targetIdx);
              break;
            }
        }
      }
    }
  }

  const updateImageField = (idx: number, field: keyof ImageType, value: any) => {
    setImages((imgs: ImageType[]) => imgs.map((img: ImageType, i: number) => i === idx ? { ...img, [field]: value } : img))
    onDirty()
  }

  const removeImage = (idx: number) => {
    setImages((imgs: ImageType[]) => imgs.filter((_, i: number) => i !== idx))
    onDirty()
  }

  const clearImageFile = (idx: number) => {
    setImages((imgs: ImageType[]) => imgs.map((img, i) => i === idx ? { ...img, url: '' } : img))
    onDirty()
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-500" /> Images ({images.length})
        </h3>
        {images.length < MAX_IMAGES && (
          <Button size="sm" variant="secondary" onClick={addBlankImage} className="gap-1"><Plus className="w-4 h-4"/>Add Image ({images.length}/{MAX_IMAGES})</Button>
        )}
      </div>
      {images.length === 0 && <p className="text-xs text-muted-foreground">No images yet. Click Add Image to begin.</p>}
      <div className="space-y-6">
        {images.map((img, idx) => {
          const isEditing = editingIndex === idx
          const inputId = `image-input-${img.id || idx}`
          return (
            <div key={img.id || idx} className="border rounded-md p-4 space-y-4 relative group bg-muted/20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide">Image {idx+1}</span>
                  {!isEditing && <span className="text-[11px] text-muted-foreground">{img.timeframe || 'No TF'}</span>}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <Button size="sm" variant="outline" onClick={()=> { setEditingIndex(null); }} className="gap-1">Done</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={()=> setEditingIndex(idx)} className="gap-1"><Pencil className="w-4 h-4"/>Edit</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={()=> removeImage(idx)}><Trash2 className="w-4 h-4"/></Button>
                </div>
              </div>
              {/* Editing or display area */}
              <div className="space-y-4" onPaste={e=>{ if(isEditing) onPasteAny(e as any) }}>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium uppercase tracking-wide">Timeframe</label>
                  {isEditing ? (
                    <Select value={img.timeframe || ''} onValueChange={v=>updateImageField(idx,'timeframe', v)}>
                      <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{timeframeOptions.map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <div className="text-xs text-muted-foreground">{img.timeframe || '—'}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium uppercase tracking-wide">Image</label>
                  <div
                    className="relative border rounded-md bg-background flex items-center justify-center overflow-hidden cursor-pointer h-60"
                    onClick={()=> {
                      // Always allow selecting; set current editing row then trigger file input
                      if(!isEditing) setEditingIndex(idx);
                      const input = document.getElementById(inputId) as HTMLInputElement | null;
                      input?.click();
                    }}
                  >
                    {img.url ? (
                      <img src={img.url} alt={img.description || ''} className="object-contain w-full h-full" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground text-xs select-none">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-60" />
                        <span>{isEditing ? 'Click / Paste to Upload' : 'Click to Upload'}</span>
                      </div>
                    )}
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e=>{ const f=e.target.files?.[0]; if(f) void handleFileSelectForIndex(f, idx) }}
                    />
                    {isEditing && img.url && (
                      <div className="absolute top-1 right-1 flex gap-1">
                        <Button type="button" size="sm" variant="secondary" className="h-6 text-[10px] px-2"
                          onClick={(e)=>{ e.stopPropagation(); clearImageFile(idx); }}
                        >Remove</Button>
                        <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] px-2"
                          onClick={(e)=>{ e.stopPropagation(); const input = document.getElementById(inputId) as HTMLInputElement | null; input?.click(); }}
                        >Replace</Button>
                      </div>
                    )}
                  </div>
                  {isUploading && isEditing && <p className="text-[10px] text-muted-foreground mt-1">Processing image...</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium uppercase tracking-wide">Description</label>
                  {isEditing ? (
                    <Textarea value={img.description || ''} onChange={e=>updateImageField(idx,'description', e.target.value)} className="min-h-[80px] text-xs" placeholder="Optional description" />
                  ) : (
                    <div className="text-xs text-muted-foreground min-h-[32px] whitespace-pre-wrap">{img.description || '—'}</div>
                  )}
                  {isEditing && (
                    <div className="pt-1">
                      <Button size="sm" variant="secondary" onClick={()=> { setEditingIndex(null); }}>Done</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
