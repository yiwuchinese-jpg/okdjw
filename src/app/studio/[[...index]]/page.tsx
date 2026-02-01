'use client'

import { NextStudio } from 'sanity/studio'
import config from '@/sanity/config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
