import type { ComponentType } from 'npm:react@18.3.1'
import { template as testEmail } from './test-email.tsx'
import { template as adminMessage } from './admin-message.tsx'
import { template as welcome } from './welcome.tsx'
import { template as postReceived } from './post-received.tsx'
import { template as postApproved } from './post-approved.tsx'
import { template as postApprovedAdjusted } from './post-approved-adjusted.tsx'
import { template as postPending } from './post-pending.tsx'
import { template as postPhotoDenied } from './post-photo-denied.tsx'
import { template as postDenied } from './post-denied.tsx'
import { template as commentNotification } from './comment-notification.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'test-email': testEmail,
  'admin-message': adminMessage,
  'welcome': welcome,
  'post-received': postReceived,
  'post-approved': postApproved,
  'post-approved-adjusted': postApprovedAdjusted,
  'post-pending': postPending,
  'post-photo-denied': postPhotoDenied,
  'post-denied': postDenied,
  'comment-notification': commentNotification,
}
