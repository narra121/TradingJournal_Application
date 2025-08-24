import { useState, useEffect } from 'react'
import { setLocale, getLocale, AppLocales } from './strings'
import { Button } from '@/ui/button'

export function LocaleToggle() {
  const [locale, setLoc] = useState<AppLocales>(getLocale())
  useEffect(()=>{ setLocale(locale) },[locale])
  const next = locale === 'en' ? 'es' : 'en'
  return <Button variant="ghost" size="sm" onClick={()=> setLoc(next)} aria-label="Toggle locale">{locale.toUpperCase()}</Button>
}
