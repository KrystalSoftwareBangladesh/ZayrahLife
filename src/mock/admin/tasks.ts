export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
export type BoardTaskStatus = Exclude<TaskStatus, 'backlog'>
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskDepartment = 'operations' | 'inventory' | 'marketing' | 'support' | 'finance'
export type TaskIssueType = 'task' | 'ops' | 'bug' | 'campaign'
export type SprintStatus = 'planned' | 'active' | 'completed'

export interface Space {
  id: string
  key: string
  name: string
  description: string
  lead: string
}

export interface Sprint {
  id: string
  spaceId: string
  name: string
  goal: string
  startDate: string
  endDate: string
  capacity: number
  status: SprintStatus
  focus: string[]
}

export interface EcommerceTask {
  id: string
  spaceId: string
  title: string
  description: string
  department: TaskDepartment
  priority: TaskPriority
  issueType: TaskIssueType
  status: TaskStatus
  sprintId: string | null
  storyPoints: number
  assignee: string
  dueDate: string
  createdAt: string
  completedAt: string | null
  referenceLabel: string
  referenceValue: string
  tags: string[]
  blocked: boolean
  checklistDone: number
  checklistTotal: number
  ordersAffected: number
  revenueAtRisk: number
}

export interface TaskBoardColumn {
  id: BoardTaskStatus
  title: string
  description: string
  limit: number
  accentClass: string
  surfaceClass: string
  borderClass: string
}

export const departmentOptions: Array<{ label: string, value: TaskDepartment }> = [
  { label: 'Operations', value: 'operations' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Customer Support', value: 'support' },
  { label: 'Finance', value: 'finance' }
]

export const priorityOptions: Array<{ label: string, value: TaskPriority }> = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
]

export const issueTypeOptions: Array<{ label: string, value: TaskIssueType }> = [
  { label: 'Task', value: 'task' },
  { label: 'Ops', value: 'ops' },
  { label: 'Bug', value: 'bug' },
  { label: 'Campaign', value: 'campaign' }
]

export const mockSpaces: Space[] = [
  {
    id: 'space-ops',
    key: 'OPS',
    name: 'Operations Command',
    description:
      'Owns fulfillment flow, inventory coordination, courier handoffs, and customer-facing operational recovery.',
    lead: 'Ayesha Rahman'
  },
  {
    id: 'space-gtm',
    key: 'GTM',
    name: 'Growth Studio',
    description:
      'Runs storefront campaigns, lifecycle messaging, merchandising updates, and conversion experiments.',
    lead: 'Nabila Sultana'
  },
  {
    id: 'space-fin',
    key: 'FIN',
    name: 'Finance Control',
    description:
      'Handles payout reconciliation, payment risk, refund integrity, and weekly courier settlement controls.',
    lead: 'Farhan Kabir'
  }
]

export const mockSprints: Sprint[] = [
  {
    id: 'SPR-24',
    spaceId: 'space-ops',
    name: 'Sprint 24',
    goal:
      'Protect Ramadan demand by stabilizing dispatch, inventory sync, and courier promise accuracy.',
    startDate: '2026-03-09',
    endDate: '2026-03-15',
    capacity: 34,
    status: 'active',
    focus: ['Dispatch reliability', 'Inventory accuracy', 'Checkout promises']
  },
  {
    id: 'SPR-25',
    spaceId: 'space-ops',
    name: 'Sprint 25',
    goal:
      'Reduce support load with better warehouse process control and clearer recovery playbooks.',
    startDate: '2026-03-16',
    endDate: '2026-03-22',
    capacity: 26,
    status: 'planned',
    focus: ['Support playbooks', 'Returns process', 'Quality response']
  },
  {
    id: 'SPR-23',
    spaceId: 'space-ops',
    name: 'Sprint 23',
    goal: 'Close aging catalog cleanup and route communication issues before peak dispatch week.',
    startDate: '2026-03-02',
    endDate: '2026-03-08',
    capacity: 20,
    status: 'completed',
    focus: ['Catalog cleanup', 'Courier alignment', 'Operations hygiene']
  },
  {
    id: 'SPR-31',
    spaceId: 'space-gtm',
    name: 'Sprint 31',
    goal:
      'Ship Ramadan creative, bundle merchandising, and lifecycle QA before paid traffic ramps up.',
    startDate: '2026-03-09',
    endDate: '2026-03-15',
    capacity: 18,
    status: 'active',
    focus: ['Homepage refresh', 'Bundle pricing', 'Retention QA']
  },
  {
    id: 'SPR-30',
    spaceId: 'space-gtm',
    name: 'Sprint 30',
    goal: 'Prepare next-wave merchandising tests and content cleanup for the post-Ramadan push.',
    startDate: '2026-03-16',
    endDate: '2026-03-22',
    capacity: 16,
    status: 'planned',
    focus: ['Product storytelling', 'Collection cleanup', 'CRM sequencing']
  },
  {
    id: 'SPR-32',
    spaceId: 'space-fin',
    name: 'Sprint 32',
    goal:
      'Reduce payout risk by moving refund review and invoice mismatch checks into a tighter weekly cadence.',
    startDate: '2026-03-09',
    endDate: '2026-03-15',
    capacity: 14,
    status: 'active',
    focus: ['Refund controls', 'Invoice review', 'Settlement exceptions']
  },
  {
    id: 'SPR-22',
    spaceId: 'space-fin',
    name: 'Sprint 22',
    goal: 'Complete courier payout reconciliation and remove manual handoff ambiguity in finance ops.',
    startDate: '2026-03-02',
    endDate: '2026-03-08',
    capacity: 12,
    status: 'completed',
    focus: ['Courier payouts', 'Accounting hygiene', 'Dispute tracking']
  }
]

export const taskBoardColumns: TaskBoardColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    description: 'Committed work that is ready to be pulled during the sprint.',
    limit: 6,
    accentClass: 'bg-slate-900 text-white',
    surfaceClass: 'bg-slate-50',
    borderClass: 'border-slate-200'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    description: 'Execution work currently in motion across teams.',
    limit: 4,
    accentClass: 'bg-sky-700 text-white',
    surfaceClass: 'bg-sky-50',
    borderClass: 'border-sky-200'
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Waiting for QA, approval, or cross-team validation.',
    limit: 3,
    accentClass: 'bg-amber-500 text-slate-950',
    surfaceClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  {
    id: 'done',
    title: 'Done',
    description: 'Finished sprint work with no open follow-up.',
    limit: 99,
    accentClass: 'bg-emerald-600 text-white',
    surfaceClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  }
]

export const statusOptions: Array<{ label: string, value: TaskStatus }> = [
  { label: 'Backlog', value: 'backlog' },
  ...taskBoardColumns.map(column => ({
    label: column.title,
    value: column.id
  }))
]

export const mockTaskBoard: EcommerceTask[] = [
  {
    id: 'TASK-2026-101',
    spaceId: 'space-ops',
    title: 'Clear held COD orders before evening dispatch',
    description:
      'Courier pickup was delayed for one route. Review held cash-on-delivery orders, confirm stock allocation, and release eligible parcels before the 6 PM handoff.',
    department: 'operations',
    priority: 'urgent',
    issueType: 'ops',
    status: 'in_progress',
    sprintId: 'SPR-24',
    storyPoints: 5,
    assignee: 'Ayesha Rahman',
    dueDate: '2026-03-10',
    createdAt: '2026-03-09',
    completedAt: null,
    referenceLabel: 'Dispatch batch',
    referenceValue: 'Dhaka evening route',
    tags: ['shipping', 'cod', 'dispatch'],
    blocked: false,
    checklistDone: 2,
    checklistTotal: 4,
    ordersAffected: 42,
    revenueAtRisk: 1840
  },
  {
    id: 'TASK-2026-102',
    spaceId: 'space-ops',
    title: 'Restock best-selling serum before weekend traffic spike',
    description:
      'PO is already approved. Confirm supplier ETA, update receiving schedule, and reserve inbound inventory for the flagship serum bundle landing page.',
    department: 'inventory',
    priority: 'high',
    issueType: 'task',
    status: 'todo',
    sprintId: 'SPR-24',
    storyPoints: 5,
    assignee: 'Tanvir Islam',
    dueDate: '2026-03-11',
    createdAt: '2026-03-08',
    completedAt: null,
    referenceLabel: 'SKU',
    referenceValue: 'GLW-SRM-50ML',
    tags: ['procurement', 'restock', 'bestseller'],
    blocked: false,
    checklistDone: 1,
    checklistTotal: 3,
    ordersAffected: 28,
    revenueAtRisk: 1260
  },
  {
    id: 'TASK-2026-103',
    spaceId: 'space-gtm',
    title: 'Publish Ramadan homepage hero and bundle pricing',
    description:
      'Creative is approved. Replace homepage hero, update bundle cards, and confirm coupon rules are active before the campaign window opens.',
    department: 'marketing',
    priority: 'high',
    issueType: 'campaign',
    status: 'review',
    sprintId: 'SPR-31',
    storyPoints: 8,
    assignee: 'Nabila Sultana',
    dueDate: '2026-03-10',
    createdAt: '2026-03-07',
    completedAt: null,
    referenceLabel: 'Campaign',
    referenceValue: 'Ramadan Glow Bundle',
    tags: ['campaign', 'homepage', 'promo'],
    blocked: false,
    checklistDone: 4,
    checklistTotal: 5,
    ordersAffected: 0,
    revenueAtRisk: 2200
  },
  {
    id: 'TASK-2026-104',
    spaceId: 'space-fin',
    title: 'Review duplicate refund requests from marketplace buyers',
    description:
      'A small set of customers submitted repeat refund tickets through two channels. Match order IDs, verify payment reversals, and prevent double settlement.',
    department: 'finance',
    priority: 'urgent',
    issueType: 'bug',
    status: 'backlog',
    sprintId: null,
    storyPoints: 3,
    assignee: 'Farhan Kabir',
    dueDate: '2026-03-10',
    createdAt: '2026-03-10',
    completedAt: null,
    referenceLabel: 'Payment issue',
    referenceValue: 'Marketplace refunds',
    tags: ['refund', 'marketplace', 'risk'],
    blocked: true,
    checklistDone: 0,
    checklistTotal: 3,
    ordersAffected: 6,
    revenueAtRisk: 480
  },
  {
    id: 'TASK-2026-105',
    spaceId: 'space-ops',
    title: 'Resolve three-star review trend on wireless earbuds',
    description:
      'Support has grouped recurring complaints about charge retention. Prepare response guidance, inspect the latest receiving batches, and decide whether defect rate is rising.',
    department: 'support',
    priority: 'medium',
    issueType: 'task',
    status: 'todo',
    sprintId: 'SPR-25',
    storyPoints: 3,
    assignee: 'Maliha Noor',
    dueDate: '2026-03-18',
    createdAt: '2026-03-09',
    completedAt: null,
    referenceLabel: 'Product',
    referenceValue: 'Wireless Earbuds Pro',
    tags: ['reviews', 'customer-care', 'quality'],
    blocked: false,
    checklistDone: 0,
    checklistTotal: 4,
    ordersAffected: 14,
    revenueAtRisk: 690
  },
  {
    id: 'TASK-2026-106',
    spaceId: 'space-ops',
    title: 'Fix failed sync for late-night warehouse counts',
    description:
      'The last cycle count did not fully sync to the storefront. Reconcile the mismatch, verify stock reservations, and release oversold SKUs only after confirmation.',
    department: 'inventory',
    priority: 'urgent',
    issueType: 'bug',
    status: 'in_progress',
    sprintId: 'SPR-24',
    storyPoints: 8,
    assignee: 'Sabbir Hossain',
    dueDate: '2026-03-10',
    createdAt: '2026-03-09',
    completedAt: null,
    referenceLabel: 'Inventory sync',
    referenceValue: 'Warehouse B',
    tags: ['sync', 'stock', 'ops'],
    blocked: true,
    checklistDone: 2,
    checklistTotal: 5,
    ordersAffected: 33,
    revenueAtRisk: 1575
  },
  {
    id: 'TASK-2026-107',
    spaceId: 'space-ops',
    title: 'Prepare care-script for delayed prepaid orders',
    description:
      'Support should have one approved message template for delayed prepaid shipments with compensation rules and ETA promises before queue volume increases.',
    department: 'support',
    priority: 'medium',
    issueType: 'task',
    status: 'backlog',
    sprintId: null,
    storyPoints: 2,
    assignee: 'Rafi Chowdhury',
    dueDate: '2026-03-13',
    createdAt: '2026-03-10',
    completedAt: null,
    referenceLabel: 'Support playbook',
    referenceValue: 'Delayed prepaid queue',
    tags: ['sla', 'messaging', 'retention'],
    blocked: false,
    checklistDone: 0,
    checklistTotal: 2,
    ordersAffected: 19,
    revenueAtRisk: 540
  },
  {
    id: 'TASK-2026-108',
    spaceId: 'space-fin',
    title: 'Approve courier payout reconciliation sheet',
    description:
      'Cross-check courier settlement rows against delivered counts, COD collections, and previous dispute notes before releasing the payout.',
    department: 'finance',
    priority: 'high',
    issueType: 'task',
    status: 'done',
    sprintId: 'SPR-22',
    storyPoints: 3,
    assignee: 'Samia Akter',
    dueDate: '2026-03-07',
    createdAt: '2026-03-05',
    completedAt: '2026-03-08',
    referenceLabel: 'Reconciliation',
    referenceValue: 'Courier payout week 10',
    tags: ['courier', 'accounts', 'settlement'],
    blocked: false,
    checklistDone: 3,
    checklistTotal: 3,
    ordersAffected: 0,
    revenueAtRisk: 0
  },
  {
    id: 'TASK-2026-109',
    spaceId: 'space-gtm',
    title: 'QA abandoned-cart SMS flow after template changes',
    description:
      'New copy was uploaded this morning. Validate links, discount codes, and opt-out behavior before paid campaign traffic returns next sprint.',
    department: 'marketing',
    priority: 'medium',
    issueType: 'campaign',
    status: 'todo',
    sprintId: 'SPR-31',
    storyPoints: 3,
    assignee: 'Imran Hossain',
    dueDate: '2026-03-17',
    createdAt: '2026-03-08',
    completedAt: null,
    referenceLabel: 'Automation',
    referenceValue: 'Abandoned cart SMS',
    tags: ['crm', 'retention', 'qa'],
    blocked: false,
    checklistDone: 0,
    checklistTotal: 3,
    ordersAffected: 0,
    revenueAtRisk: 860
  },
  {
    id: 'TASK-2026-110',
    spaceId: 'space-ops',
    title: 'Archive discontinued variants from the storefront',
    description:
      'Aged variants are still visible on some category pages. Remove them from merchandising slots and mark the final stock as clearance-only in the admin panel.',
    department: 'operations',
    priority: 'low',
    issueType: 'task',
    status: 'done',
    sprintId: 'SPR-23',
    storyPoints: 2,
    assignee: 'Sharmin Jahan',
    dueDate: '2026-03-06',
    createdAt: '2026-03-03',
    completedAt: '2026-03-06',
    referenceLabel: 'Catalog cleanup',
    referenceValue: 'Discontinued variants',
    tags: ['catalog', 'cleanup'],
    blocked: false,
    checklistDone: 2,
    checklistTotal: 2,
    ordersAffected: 0,
    revenueAtRisk: 0
  },
  {
    id: 'TASK-2026-111',
    spaceId: 'space-ops',
    title: 'Validate courier promise windows after route reroute',
    description:
      'Customer-facing ETA promises were changed after the courier reroute. Confirm checkout messaging and order confirmation emails now match the actual handoff windows.',
    department: 'operations',
    priority: 'medium',
    issueType: 'ops',
    status: 'done',
    sprintId: 'SPR-24',
    storyPoints: 3,
    assignee: 'Nusrat Jahan',
    dueDate: '2026-03-09',
    createdAt: '2026-03-08',
    completedAt: '2026-03-10',
    referenceLabel: 'Checkout promise',
    referenceValue: 'Courier route update',
    tags: ['checkout', 'eta', 'courier'],
    blocked: false,
    checklistDone: 3,
    checklistTotal: 3,
    ordersAffected: 11,
    revenueAtRisk: 320
  },
  {
    id: 'TASK-2026-112',
    spaceId: 'space-ops',
    title: 'Draft damaged-returns SOP for warehouse intake',
    description:
      'Returns with transit damage still follow informal steps. Document a single intake checklist with photo evidence rules, refund triggers, and stock quarantine handling.',
    department: 'operations',
    priority: 'low',
    issueType: 'task',
    status: 'backlog',
    sprintId: null,
    storyPoints: 5,
    assignee: 'Mahmud Hasan',
    dueDate: '2026-03-14',
    createdAt: '2026-03-10',
    completedAt: null,
    referenceLabel: 'Returns SOP',
    referenceValue: 'Damaged parcels',
    tags: ['returns', 'warehouse', 'process'],
    blocked: false,
    checklistDone: 0,
    checklistTotal: 4,
    ordersAffected: 0,
    revenueAtRisk: 0
  },
  {
    id: 'TASK-2026-113',
    spaceId: 'space-fin',
    title: 'Automate courier invoice mismatch review',
    description:
      'Finance still checks weekly courier invoice mismatches manually. Build a repeatable review template and alert flow before the next payout cycle.',
    department: 'finance',
    priority: 'high',
    issueType: 'task',
    status: 'todo',
    sprintId: 'SPR-32',
    storyPoints: 5,
    assignee: 'Adnan Karim',
    dueDate: '2026-03-20',
    createdAt: '2026-03-09',
    completedAt: null,
    referenceLabel: 'Invoice audit',
    referenceValue: 'Courier mismatch tracker',
    tags: ['finance', 'automation', 'audit'],
    blocked: false,
    checklistDone: 0,
    checklistTotal: 4,
    ordersAffected: 9,
    revenueAtRisk: 410
  }
]
