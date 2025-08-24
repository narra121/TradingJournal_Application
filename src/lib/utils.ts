import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Local copy of utilities so imports like "@/lib/utils" resolve without circular re-exports
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function formatDate(input: string | number): string {
	const date = new Date(input)
	return date.toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	})
}

export function absoluteUrl(path: string) {
	return `${import.meta.env?.VITE_APP_URL || ''}${path}`
}