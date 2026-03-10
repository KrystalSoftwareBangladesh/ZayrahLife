<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormModal from '@/components/admin/FormModal.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import StatCard from '@/components/admin/StatCard.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import {
  departmentOptions,
  issueTypeOptions,
  priorityOptions,
  statusOptions,
  taskBoardColumns,
  type BoardTaskStatus,
  type EcommerceTask,
  type Space,
  type Sprint,
  type SprintStatus,
  type TaskDepartment,
  type TaskIssueType,
  type TaskPriority,
  type TaskStatus
} from '@/mock/admin/tasks'
import { useTaskStore } from '@/stores/admin/taskStore'

type ViewMode = 'board' | 'backlog'
type DepartmentFilter = TaskDepartment | 'all'
type PriorityFilter = TaskPriority | 'all'
type AssigneeFilter = string | 'all'

interface CreateTaskForm {
  title: string
  description: string
  department: TaskDepartment
  priority: TaskPriority
  issueType: TaskIssueType
  status: TaskStatus
  sprintId: string
  storyPoints: number
  assignee: string
  dueDate: string
  referenceLabel: string
  referenceValue: string
  tags: string
}

interface SprintForm {
  name: string
  goal: string
  startDate: string
  endDate: string
  capacity: number
  status: SprintStatus
  focus: string
}

interface SpaceForm {
  key: string
  name: string
  lead: string
  description: string
}

const taskStore = useTaskStore()

const viewMode = ref<ViewMode>('board')
const isCreateModalOpen = ref(false)
const isSprintModalOpen = ref(false)
const isSpaceModalOpen = ref(false)
const sprintModalMode = ref<'create' | 'edit'>('create')
const spaceModalMode = ref<'create' | 'edit'>('create')
const editingSprintId = ref<string | null>(null)
const editingSpaceId = ref<string | null>(null)
const selectedTaskId = ref<string | null>(null)
const draggingTaskId = ref<string | null>(null)
const activeDropZone = ref<BoardTaskStatus | null>(null)
const pendingDeleteSpaceId = ref<string | null>(null)

const filters = reactive<{
  search: string
  department: DepartmentFilter
  priority: PriorityFilter
  assignee: AssigneeFilter
}>({
  search: '',
  department: 'all',
  priority: 'all',
  assignee: 'all'
})

const createForm = reactive<CreateTaskForm>({
  title: '',
  description: '',
  department: 'operations',
  priority: 'medium',
  issueType: 'task',
  status: 'backlog',
  sprintId: '',
  storyPoints: 3,
  assignee: '',
  dueDate: getTodayKey(),
  referenceLabel: 'Workflow',
  referenceValue: '',
  tags: ''
})

const formErrors = reactive({
  title: '',
  assignee: '',
  dueDate: '',
  storyPoints: ''
})

const sprintForm = reactive<SprintForm>({
  name: '',
  goal: '',
  startDate: getTodayKey(),
  endDate: getDateKeyWithOffset(7),
  capacity: 20,
  status: 'planned',
  focus: ''
})

const sprintFormErrors = reactive({
  name: '',
  startDate: '',
  endDate: '',
  capacity: ''
})

const spaceForm = reactive<SpaceForm>({
  key: '',
  name: '',
  lead: '',
  description: ''
})

const spaceFormErrors = reactive({
  key: '',
  name: '',
  lead: ''
})

watch(
  () => createForm.sprintId,
  nextSprintId => {
    if (!nextSprintId) {
      createForm.status = 'backlog'
      return
    }

    if (createForm.status === 'backlog') {
      createForm.status = 'todo'
    }
  }
)

watch(
  () => taskStore.currentSpaceId,
  () => {
    resetFilters()
    clearDragState()
    closeTaskDetails()
    closeCreateModal()
    closeSprintModal()
  }
)

const priorityClassMap: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-800',
  urgent: 'bg-rose-100 text-rose-700'
}

const departmentClassMap: Record<TaskDepartment, string> = {
  operations: 'bg-primary-100 text-primary-700',
  inventory: 'bg-sky-100 text-sky-700',
  marketing: 'bg-violet-100 text-violet-700',
  support: 'bg-orange-100 text-orange-700',
  finance: 'bg-emerald-100 text-emerald-700'
}

const issueTypeClassMap: Record<TaskIssueType, string> = {
  task: 'bg-slate-100 text-slate-700',
  ops: 'bg-primary-100 text-primary-700',
  bug: 'bg-rose-100 text-rose-700',
  campaign: 'bg-violet-100 text-violet-700'
}

const sprintStateClassMap: Record<SprintStatus, string> = {
  planned: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-900 text-white'
}

const sprintStatusOptions: Array<{ label: string, value: SprintStatus }> = [
  { label: 'Planned', value: 'planned' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' }
]

const filterDepartmentOptions = [
  { label: 'All teams', value: 'all' },
  ...departmentOptions
]

const filterPriorityOptions = [
  { label: 'All priorities', value: 'all' },
  ...priorityOptions
]

const currentSpace = computed(() => taskStore.currentSpace)
const activeSprint = computed(() => taskStore.activeSprint)

const filterAssigneeOptions = computed(() => [
  { label: 'All assignees', value: 'all' },
  ...Array.from(new Set(taskStore.currentSpaceTasks.map(task => task.assignee)))
    .sort((left, right) => left.localeCompare(right))
    .map(assignee => ({
      label: assignee,
      value: assignee
    }))
])

const boardStatusOptions = statusOptions.filter(
  (option): option is { label: string, value: BoardTaskStatus } => option.value !== 'backlog'
)

const planningOptions = computed<Array<{ label: string, value: string }>>(() => [
  { label: 'Unscheduled backlog', value: '' },
  ...taskStore.currentSpaceSprints
    .filter(sprint => sprint.status !== 'completed')
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map(sprint => ({
      label: sprint.status === 'active' ? `${sprint.name} (Active)` : sprint.name,
      value: sprint.id
    }))
])

watch(
  planningOptions,
  nextOptions => {
    if (createForm.sprintId && !nextOptions.some(option => option.value === createForm.sprintId)) {
      createForm.sprintId = ''
    }
  },
  { deep: true }
)

const createStatusOptions = computed<Array<{ label: string, value: TaskStatus }>>(() =>
  createForm.sprintId ? boardStatusOptions : [{ label: 'Backlog', value: 'backlog' }]
)

const selectedTask = computed(() => {
  if (!selectedTaskId.value) return null
  const task = taskStore.getTaskById(selectedTaskId.value)
  if (!task || task.spaceId !== taskStore.currentSpaceId) return null
  return task
})

const filteredTasks = computed(() => {
  const query = filters.search.trim().toLowerCase()

  return taskStore.currentSpaceTasks.filter(task => {
    const matchesSearch =
      query.length === 0 ||
      [
        task.id,
        task.title,
        task.assignee,
        task.referenceLabel,
        task.referenceValue,
        task.description,
        ...task.tags
      ].some(value => value.toLowerCase().includes(query))

    const matchesDepartment = filters.department === 'all' || task.department === filters.department
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority
    const matchesAssignee = filters.assignee === 'all' || task.assignee === filters.assignee

    return matchesSearch && matchesDepartment && matchesPriority && matchesAssignee
  })
})

const boardColumns = computed(() =>
  taskBoardColumns.map(column => ({
    ...column,
    tasks: filteredTasks.value.filter(
      task => task.sprintId === activeSprint.value?.id && task.status === column.id
    )
  }))
)

const unscheduledBacklogTasks = computed(() =>
  filteredTasks.value.filter(task => task.sprintId === null)
)

const plannedSprintGroups = computed(() =>
  taskStore.plannedSprints.map(sprint => ({
    ...sprint,
    tasks: filteredTasks.value.filter(task => task.sprintId === sprint.id)
  }))
)

const backlogDepartmentLoad = computed(() =>
  departmentOptions
    .map(option => ({
      ...option,
      count: unscheduledBacklogTasks.value.filter(task => task.department === option.value).length
    }))
    .filter(option => option.count > 0)
)

const lastCompletedSprint = computed(() => taskStore.completedSprints[0] || null)

const lastCompletedSprintMetrics = computed(() => {
  if (!lastCompletedSprint.value) return null

  const sprintTasks = taskStore.currentSpaceTasks.filter(
    task => task.sprintId === lastCompletedSprint.value?.id
  )
  const deliveredPoints = sprintTasks
    .filter(task => task.status === 'done')
    .reduce((sum, task) => sum + task.storyPoints, 0)

  return {
    issues: sprintTasks.length,
    deliveredPoints
  }
})

const boardVisibleTaskCount = computed(() =>
  boardColumns.value.reduce((sum, column) => sum + column.tasks.length, 0)
)

const backlogVisibleTaskCount = computed(() =>
  unscheduledBacklogTasks.value.length +
  plannedSprintGroups.value.reduce((sum, sprint) => sum + sprint.tasks.length, 0)
)

const unscheduledUrgentCount = computed(() =>
  taskStore.backlogTasks.filter(task => task.priority === 'urgent').length
)

const stats = computed(() =>
  viewMode.value === 'board'
    ? [
        {
          title: 'Open In Sprint',
          value: taskStore.openTasks,
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
          color: 'blue'
        },
        {
          title: 'Blocked Issues',
          value: taskStore.blockedTasks,
          icon: 'M12 9v4m0 4h.01M10.3 3.8l-8 14A1 1 0 003.2 19h17.6a1 1 0 00.9-1.5l-8-14a1 1 0 00-1.8 0z',
          color: 'red'
        },
        {
          title: 'Orders Affected',
          value: taskStore.ordersAffected,
          icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17',
          color: 'yellow'
        },
        {
          title: 'Sprint Progress',
          value: `${taskStore.activeSprintDonePoints}/${taskStore.activeSprintCommittedPoints} pts`,
          icon: 'M5 13l4 4L19 7',
          color: 'green'
        }
      ]
    : [
        {
          title: 'Unscheduled Issues',
          value: taskStore.backlogTaskCount,
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
          color: 'blue'
        },
        {
          title: 'Planned Issues',
          value: taskStore.plannedTaskCount,
          icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1',
          color: 'purple'
        },
        {
          title: 'Backlog Points',
          value: taskStore.backlogStoryPoints,
          icon: 'M12 8v8m-4-4h8',
          color: 'yellow'
        },
        {
          title: 'Urgent In Backlog',
          value: unscheduledUrgentCount.value,
          icon: 'M12 9v4m0 4h.01M10.3 3.8l-8 14A1 1 0 003.2 19h17.6a1 1 0 00.9-1.5l-8-14a1 1 0 00-1.8 0z',
          color: 'red'
        }
      ]
)

const spaceSummaries = computed(() =>
  taskStore.spaces.map(space => {
    const spaceTasks = taskStore.tasks.filter(task => task.spaceId === space.id)
    const spaceSprints = taskStore.sprints.filter(sprint => sprint.spaceId === space.id)
    const activeSpaceSprint = spaceSprints.find(sprint => sprint.status === 'active') || null

    return {
      ...space,
      issueCount: spaceTasks.length,
      backlogCount: spaceTasks.filter(task => task.sprintId === null).length,
      openCount: spaceTasks.filter(task => task.status !== 'done').length,
      sprintCount: spaceSprints.length,
      plannedSprintCount: spaceSprints.filter(sprint => sprint.status === 'planned').length,
      activeSprintName: activeSpaceSprint?.name || null
    }
  })
)

const currentSpaceSummary = computed(
  () => spaceSummaries.value.find(space => space.id === taskStore.currentSpaceId) || null
)

const deleteSpaceSummary = computed(
  () => spaceSummaries.value.find(space => space.id === pendingDeleteSpaceId.value) || null
)

const hasActiveFilters = computed(() =>
  filters.search.trim().length > 0 ||
  filters.department !== 'all' ||
  filters.priority !== 'all' ||
  filters.assignee !== 'all'
)

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateKeyWithOffset(offsetDays: number) {
  const now = new Date()
  now.setDate(now.getDate() + offsetDays)
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeSpaceKey(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

function formatDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed)
}

function formatSprintRange(sprint: Sprint) {
  return `${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}`
}

function getDepartmentLabel(department: TaskDepartment) {
  return departmentOptions.find(option => option.value === department)?.label || department
}

function getIssueTypeLabel(issueType: TaskIssueType) {
  return issueTypeOptions.find(option => option.value === issueType)?.label || issueType
}

function getStatusLabel(status: TaskStatus) {
  return statusOptions.find(option => option.value === status)?.label || status
}

function getSprintName(sprintId: string | null) {
  if (!sprintId) return 'Unscheduled backlog'
  return taskStore.getSprintById(sprintId)?.name || sprintId
}

function getSpaceName(spaceId: string) {
  return taskStore.getSpaceById(spaceId)?.name || spaceId
}

function getChecklistPercent(task: EcommerceTask) {
  if (task.checklistTotal === 0) return 0
  return Math.min(100, Math.round((task.checklistDone / task.checklistTotal) * 100))
}

function getSprintTaskPoints(tasks: EcommerceTask[]) {
  return tasks.reduce((sum, task) => sum + task.storyPoints, 0)
}

function getDueState(task: EcommerceTask) {
  if (task.status === 'done') {
    return {
      label: task.completedAt ? `Done ${formatDate(task.completedAt)}` : 'Done',
      className: 'bg-emerald-100 text-emerald-700'
    }
  }

  if (task.dueDate < getTodayKey()) {
    return {
      label: `Overdue ${formatDate(task.dueDate)}`,
      className: 'bg-rose-100 text-rose-700'
    }
  }

  if (task.dueDate === getTodayKey()) {
    return {
      label: 'Due today',
      className: 'bg-amber-100 text-amber-800'
    }
  }

  return {
    label: `Due ${formatDate(task.dueDate)}`,
    className: 'bg-slate-100 text-slate-700'
  }
}

function resetFilters() {
  filters.search = ''
  filters.department = 'all'
  filters.priority = 'all'
  filters.assignee = 'all'
}

function buildSprintFocusValue(focus: string[]) {
  return focus.join(', ')
}

function openTaskDetails(taskId: string) {
  selectedTaskId.value = taskId
}

function closeTaskDetails() {
  selectedTaskId.value = null
}

function handleDragStart(taskId: string) {
  draggingTaskId.value = taskId
}

function handleDrop(status: BoardTaskStatus) {
  if (!draggingTaskId.value) return
  taskStore.moveTask(draggingTaskId.value, status)
  draggingTaskId.value = null
  activeDropZone.value = null
}

function clearDragState() {
  draggingTaskId.value = null
  activeDropZone.value = null
}

function moveTaskFromSelect(taskId: string, event: Event) {
  const target = event.target as HTMLSelectElement
  taskStore.moveTask(taskId, target.value as TaskStatus)
}

function moveTaskToSprint(taskId: string, event: Event) {
  const target = event.target as HTMLSelectElement
  taskStore.assignTaskToSprint(taskId, target.value || null)
}

function moveSelectedTask(event: Event) {
  if (!selectedTask.value) return
  const target = event.target as HTMLSelectElement
  taskStore.moveTask(selectedTask.value.id, target.value as TaskStatus)
}

function moveSelectedTaskToSprint(event: Event) {
  if (!selectedTask.value) return
  const target = event.target as HTMLSelectElement
  taskStore.assignTaskToSprint(selectedTask.value.id, target.value || null)
}

function toggleSelectedTaskBlocked() {
  if (!selectedTask.value) return
  taskStore.setTaskBlocked(selectedTask.value.id, !selectedTask.value.blocked)
}

function selectSpace(spaceId: string) {
  taskStore.setCurrentSpace(spaceId)
}

function resetCreateForm() {
  createForm.title = ''
  createForm.description = ''
  createForm.department = 'operations'
  createForm.priority = 'medium'
  createForm.issueType = 'task'
  createForm.status = 'backlog'
  createForm.sprintId = ''
  createForm.storyPoints = 3
  createForm.assignee = ''
  createForm.dueDate = getTodayKey()
  createForm.referenceLabel = 'Workflow'
  createForm.referenceValue = ''
  createForm.tags = ''
  formErrors.title = ''
  formErrors.assignee = ''
  formErrors.dueDate = ''
  formErrors.storyPoints = ''
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  resetCreateForm()
}

function resetSprintForm() {
  sprintForm.name = ''
  sprintForm.goal = ''
  sprintForm.startDate = getTodayKey()
  sprintForm.endDate = getDateKeyWithOffset(7)
  sprintForm.capacity = 20
  sprintForm.status = 'planned'
  sprintForm.focus = ''
  sprintFormErrors.name = ''
  sprintFormErrors.startDate = ''
  sprintFormErrors.endDate = ''
  sprintFormErrors.capacity = ''
}

function openCreateSprintModal() {
  sprintModalMode.value = 'create'
  editingSprintId.value = null
  resetSprintForm()
  isSprintModalOpen.value = true
}

function openEditSprintModal(sprint: Sprint) {
  sprintModalMode.value = 'edit'
  editingSprintId.value = sprint.id
  sprintForm.name = sprint.name
  sprintForm.goal = sprint.goal
  sprintForm.startDate = sprint.startDate
  sprintForm.endDate = sprint.endDate
  sprintForm.capacity = sprint.capacity
  sprintForm.status = sprint.status
  sprintForm.focus = buildSprintFocusValue(sprint.focus)
  sprintFormErrors.name = ''
  sprintFormErrors.startDate = ''
  sprintFormErrors.endDate = ''
  sprintFormErrors.capacity = ''
  isSprintModalOpen.value = true
}

function closeSprintModal() {
  isSprintModalOpen.value = false
  editingSprintId.value = null
  resetSprintForm()
}

function resetSpaceForm() {
  spaceForm.key = ''
  spaceForm.name = ''
  spaceForm.lead = ''
  spaceForm.description = ''
  spaceFormErrors.key = ''
  spaceFormErrors.name = ''
  spaceFormErrors.lead = ''
}

function openCreateSpaceModal() {
  spaceModalMode.value = 'create'
  editingSpaceId.value = null
  resetSpaceForm()
  isSpaceModalOpen.value = true
}

function openEditSpaceModal(space: Space) {
  spaceModalMode.value = 'edit'
  editingSpaceId.value = space.id
  spaceForm.key = space.key
  spaceForm.name = space.name
  spaceForm.lead = space.lead
  spaceForm.description = space.description
  spaceFormErrors.key = ''
  spaceFormErrors.name = ''
  spaceFormErrors.lead = ''
  isSpaceModalOpen.value = true
}

function closeSpaceModal() {
  isSpaceModalOpen.value = false
  editingSpaceId.value = null
  resetSpaceForm()
}

function openDeleteSpacePrompt(space: Space) {
  pendingDeleteSpaceId.value = space.id
}

function closeDeleteSpacePrompt() {
  pendingDeleteSpaceId.value = null
}

function confirmDeleteSpace() {
  if (!pendingDeleteSpaceId.value) return
  taskStore.deleteSpace(pendingDeleteSpaceId.value)
  closeDeleteSpacePrompt()
}

function submitCreateTask() {
  formErrors.title = createForm.title.trim() ? '' : 'Title is required'
  formErrors.assignee = createForm.assignee.trim() ? '' : 'Assignee is required'
  formErrors.dueDate = createForm.dueDate ? '' : 'Due date is required'
  formErrors.storyPoints = createForm.storyPoints > 0 ? '' : 'Story points must be at least 1'

  if (formErrors.title || formErrors.assignee || formErrors.dueDate || formErrors.storyPoints) {
    return
  }

  const createdTask = taskStore.addTask({
    title: createForm.title,
    description: createForm.description,
    department: createForm.department,
    priority: createForm.priority,
    issueType: createForm.issueType,
    status: createForm.status,
    sprintId: createForm.sprintId || null,
    storyPoints: createForm.storyPoints,
    assignee: createForm.assignee,
    dueDate: createForm.dueDate,
    referenceLabel: createForm.referenceLabel,
    referenceValue: createForm.referenceValue,
    tags: createForm.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
  })

  if (!createdTask) return

  isCreateModalOpen.value = false
  resetCreateForm()
  selectedTaskId.value = createdTask.id
}

function submitSprintForm() {
  sprintFormErrors.name = sprintForm.name.trim() ? '' : 'Sprint name is required'
  sprintFormErrors.startDate = sprintForm.startDate ? '' : 'Start date is required'
  sprintFormErrors.endDate = sprintForm.endDate ? '' : 'End date is required'
  sprintFormErrors.capacity = sprintForm.capacity > 0 ? '' : 'Capacity must be at least 1'

  if (
    !sprintFormErrors.startDate &&
    !sprintFormErrors.endDate &&
    sprintForm.startDate &&
    sprintForm.endDate &&
    sprintForm.endDate < sprintForm.startDate
  ) {
    sprintFormErrors.endDate = 'End date must be on or after the start date'
  }

  if (
    sprintFormErrors.name ||
    sprintFormErrors.startDate ||
    sprintFormErrors.endDate ||
    sprintFormErrors.capacity
  ) {
    return
  }

  const payload = {
    name: sprintForm.name,
    goal: sprintForm.goal,
    startDate: sprintForm.startDate,
    endDate: sprintForm.endDate,
    capacity: sprintForm.capacity,
    status: sprintForm.status,
    focus: sprintForm.focus
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (sprintModalMode.value === 'create') {
    taskStore.addSprint(payload)
  } else if (editingSprintId.value) {
    taskStore.updateSprint(editingSprintId.value, payload)
  }

  closeSprintModal()
}

function submitSpaceForm() {
  spaceForm.key = normalizeSpaceKey(spaceForm.key)
  spaceFormErrors.key = spaceForm.key ? '' : 'Space key is required'
  spaceFormErrors.name = spaceForm.name.trim() ? '' : 'Space name is required'
  spaceFormErrors.lead = spaceForm.lead.trim() ? '' : 'Space lead is required'

  if (
    !spaceFormErrors.key &&
    taskStore.spaces.some(
      space => space.key === spaceForm.key && space.id !== editingSpaceId.value
    )
  ) {
    spaceFormErrors.key = 'Space key must be unique'
  }

  if (spaceFormErrors.key || spaceFormErrors.name || spaceFormErrors.lead) {
    return
  }

  const payload = {
    key: spaceForm.key,
    name: spaceForm.name,
    lead: spaceForm.lead,
    description: spaceForm.description
  }

  if (spaceModalMode.value === 'create') {
    taskStore.addSpace(payload)
  } else if (editingSpaceId.value) {
    taskStore.updateSpace(editingSpaceId.value, payload)
  }

  closeSpaceModal()
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="space-y-6">
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-primary-700">Spaces</p>
              <h2 class="mt-2 text-2xl font-semibold text-slate-900">Jira-style workspaces</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Separate your e-commerce work by business domain. Each space owns its own board,
                backlog, and sprint flow.
              </p>
            </div>

            <button
              class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              @click="openCreateSpaceModal"
            >
              Create
            </button>
          </div>

          <div class="mt-5 space-y-3">
            <article
              v-for="space in spaceSummaries"
              :key="space.id"
              :class="
                taskStore.currentSpaceId === space.id
                  ? 'border-slate-900 ring-1 ring-slate-900/10'
                  : 'border-slate-200 hover:border-slate-300'
              "
              class="cursor-pointer rounded-2xl border p-4 transition"
              @click="selectSpace(space.id)"
            >
              <div class="flex items-start gap-3">
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white"
                >
                  {{ space.key.slice(0, 2) }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {{ space.key }}
                      </p>
                      <h3 class="mt-1 text-sm font-semibold text-slate-900">{{ space.name }}</h3>
                    </div>
                    <span
                      class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                    >
                      {{ space.issueCount }} issues
                    </span>
                  </div>

                  <p class="mt-2 text-xs text-slate-500">Lead {{ space.lead }}</p>
                  <p class="mt-2 text-sm leading-6 text-slate-600">{{ space.description }}</p>

                  <div class="mt-3 flex flex-wrap gap-2">
                    <span
                      class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      Backlog {{ space.backlogCount }}
                    </span>
                    <span
                      class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      {{
                        space.activeSprintName
                          ? `Active: ${space.activeSprintName}`
                          : `${space.plannedSprintCount} planned sprint${space.plannedSprintCount === 1 ? '' : 's'}`
                      }}
                    </span>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <button
                      class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      @click.stop="openEditSpaceModal(space)"
                    >
                      Edit
                    </button>
                    <button
                      :disabled="taskStore.spaces.length === 1"
                      class="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                      :class="
                        taskStore.spaces.length === 1
                          ? 'cursor-not-allowed border-slate-200 text-slate-300'
                          : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                      "
                      @click.stop="openDeleteSpacePrompt(space)"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section
          v-if="currentSpaceSummary"
          class="rounded-3xl bg-slate-900 p-5 text-white shadow-sm"
        >
          <p class="text-xs uppercase tracking-[0.24em] text-white/60">Current space</p>
          <h2 class="mt-2 text-2xl font-semibold">{{ currentSpaceSummary.name }}</h2>
          <p class="mt-2 text-sm leading-6 text-white/75">{{ currentSpace?.description }}</p>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p class="text-xs uppercase tracking-[0.16em] text-white/60">Issues</p>
              <p class="mt-2 text-xl font-semibold">{{ currentSpaceSummary.issueCount }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p class="text-xs uppercase tracking-[0.16em] text-white/60">Open</p>
              <p class="mt-2 text-xl font-semibold">{{ currentSpaceSummary.openCount }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p class="text-xs uppercase tracking-[0.16em] text-white/60">Sprints</p>
              <p class="mt-2 text-xl font-semibold">{{ currentSpaceSummary.sprintCount }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p class="text-xs uppercase tracking-[0.16em] text-white/60">Done 7d</p>
              <p class="mt-2 text-xl font-semibold">{{ taskStore.completedThisWeek }}</p>
            </div>
          </div>
        </section>
      </aside>

      <div class="space-y-6">
        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div class="max-w-3xl">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700"
                >
                  {{ currentSpace?.key || 'SPACE' }}
                </span>
                <span
                  class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  Lead {{ currentSpace?.lead || 'Unassigned' }}
                </span>
                <button
                  v-if="currentSpace"
                  class="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  @click="openEditSpaceModal(currentSpace)"
                >
                  Edit space
                </button>
                <button
                  v-if="currentSpace"
                  :disabled="taskStore.spaces.length === 1"
                  class="rounded-full border px-3 py-1 text-xs font-medium transition"
                  :class="
                    taskStore.spaces.length === 1
                      ? 'cursor-not-allowed border-slate-200 text-slate-300'
                      : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                  "
                  @click="openDeleteSpacePrompt(currentSpace)"
                >
                  Delete space
                </button>
              </div>

              <p class="mt-4 text-xs uppercase tracking-[0.24em] text-primary-700">
                Jira-style delivery
              </p>
              <h1 class="mt-3 text-3xl font-semibold text-slate-900">
                {{ currentSpace?.name || 'Task management for e-commerce operations' }}
              </h1>
              <p class="mt-3 text-sm leading-6 text-slate-600">
                {{
                  currentSpace?.description ||
                    'Backlog is separated from the working board. Teams groom issues in backlog, commit them into sprints, and execute only sprint issues on the board.'
                }}
              </p>
              <p class="mt-3 text-sm leading-6 text-slate-600">
                Board and backlog are scoped to the selected space, so sprint planning, issue
                filters, and reporting behave more like Jira than one shared task list.
              </p>

              <div class="mt-5 inline-flex rounded-2xl bg-slate-100 p-1">
                <button
                  class="rounded-xl px-4 py-2 text-sm font-medium transition"
                  :class="
                    viewMode === 'board'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  "
                  @click="viewMode = 'board'"
                >
                  Board
                </button>
                <button
                  class="rounded-xl px-4 py-2 text-sm font-medium transition"
                  :class="
                    viewMode === 'backlog'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  "
                  @click="viewMode = 'backlog'"
                >
                  Backlog
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {{ viewMode === 'board' ? 'Active sprint' : 'Unscheduled backlog' }}
                </p>
                <p class="mt-2 text-xl font-semibold text-slate-900">
                  {{
                    viewMode === 'board' ? activeSprint?.name || 'No sprint' : taskStore.backlogTaskCount
                  }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{
                    viewMode === 'board'
                      ? 'Only sprint-committed work appears on the board.'
                      : 'Issues waiting for sprint commitment.'
                  }}
                </p>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {{ viewMode === 'board' ? 'Sprint window' : 'Planned sprints' }}
                </p>
                <p class="mt-2 text-xl font-semibold text-slate-900">
                  {{
                    viewMode === 'board' && activeSprint
                      ? formatSprintRange(activeSprint)
                      : taskStore.plannedSprints.length
                  }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{
                    viewMode === 'board'
                      ? 'Board timeline for the current execution cycle.'
                      : 'Future sprint containers for planned work.'
                  }}
                </p>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {{ viewMode === 'board' ? 'Committed points' : 'Backlog points' }}
                </p>
                <p class="mt-2 text-xl font-semibold text-slate-900">
                  {{
                    viewMode === 'board'
                      ? `${taskStore.activeSprintCommittedPoints}/${activeSprint?.capacity || 0}`
                      : taskStore.backlogStoryPoints
                  }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{
                    viewMode === 'board'
                      ? 'Sprint load against available capacity.'
                      : 'Planning effort still outside a sprint.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="viewMode === 'board' && activeSprint"
            class="mt-6 rounded-2xl bg-slate-900 px-5 py-5 text-white"
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div class="max-w-3xl">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                  >
                    Sprint goal
                  </span>
                  <span
                    class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                  >
                    {{ formatSprintRange(activeSprint) }}
                  </span>
                  <button
                    class="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-white/10"
                    @click="openEditSprintModal(activeSprint)"
                  >
                    Edit sprint
                  </button>
                </div>
                <p class="mt-3 text-sm leading-6 text-white/80">{{ activeSprint.goal }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3 lg:min-w-[320px]">
                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p class="text-xs uppercase tracking-[0.18em] text-white/60">Done points</p>
                  <p class="mt-2 text-2xl font-semibold">{{ taskStore.activeSprintDonePoints }}</p>
                </div>
                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p class="text-xs uppercase tracking-[0.18em] text-white/60">Progress</p>
                  <p class="mt-2 text-2xl font-semibold">{{ taskStore.activeSprintProgress }}%</p>
                </div>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="focus in activeSprint.focus"
                :key="focus"
                class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85"
              >
                {{ focus }}
              </span>
              <span
                v-for="team in taskStore.activeDepartmentLoad"
                :key="team.value"
                class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70"
              >
                {{ team.label }}: {{ team.count }}
              </span>
            </div>
          </div>

          <div v-else class="mt-6 flex flex-wrap gap-2">
            <span
              v-for="team in backlogDepartmentLoad"
              :key="team.value"
              class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {{ team.label }}: {{ team.count }}
            </span>
          </div>
        </section>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            v-for="stat in stats"
            :key="stat.title"
            :title="stat.title"
            :value="stat.value"
            :icon="stat.icon"
            :color="stat.color"
          />
        </div>

        <section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Search issues</label>
                <input
                  v-model="filters.search"
                  type="text"
                  placeholder="Search key, title, assignee, reference..."
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                />
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Team</label>
                <select
                  v-model="filters.department"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                >
                  <option
                    v-for="option in filterDepartmentOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                <select
                  v-model="filters.priority"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                >
                  <option
                    v-for="option in filterPriorityOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700">Assignee</label>
                <select
                  v-model="filters.assignee"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                >
                  <option
                    v-for="option in filterAssigneeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button
                v-if="hasActiveFilters"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                @click="resetFilters"
              >
                Reset filters
              </button>
              <button
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                @click="openCreateSprintModal"
              >
                Create sprint
              </button>
              <button
                class="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-800"
                @click="isCreateModalOpen = true"
              >
                Create issue
              </button>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span class="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
              {{ viewMode === 'board' ? boardVisibleTaskCount : backlogVisibleTaskCount }} issues in
              view
            </span>
            <span class="rounded-full bg-gray-100 px-3 py-1">
              {{
                viewMode === 'board'
                  ? 'Board shows only issues assigned to the active sprint.'
                  : 'Backlog groups unscheduled work and future sprints.'
              }}
            </span>
          </div>
        </section>

        <template v-if="viewMode === 'board'">
          <section
            v-if="activeSprint"
            class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div class="overflow-x-auto">
              <div class="grid min-w-[1120px] grid-cols-4 gap-4 p-4">
                <div
                  v-for="column in boardColumns"
                  :key="column.id"
                  :class="[
                    column.surfaceClass,
                    column.borderClass,
                    activeDropZone === column.id ? 'ring-2 ring-primary-300' : ''
                  ]"
                  class="rounded-2xl border p-3 transition"
                  @dragover.prevent="activeDropZone = column.id"
                  @dragenter.prevent="activeDropZone = column.id"
                  @dragleave="activeDropZone = null"
                  @drop.prevent="handleDrop(column.id)"
                >
                  <div class="mb-4 rounded-2xl px-4 py-4" :class="column.accentClass">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h2 class="text-lg font-semibold">{{ column.title }}</h2>
                        <p class="mt-1 text-xs opacity-80">{{ column.description }}</p>
                      </div>
                      <span class="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                        {{ column.tasks.length }}
                      </span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs opacity-80">
                      <span>
                        WIP limit:
                        <span class="font-semibold">
                          {{ column.limit === 99 ? 'Flexible' : column.limit }}
                        </span>
                      </span>
                      <span
                        v-if="column.limit !== 99 && column.tasks.length > column.limit"
                        class="font-semibold text-rose-100"
                      >
                        Over limit
                      </span>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <article
                      v-for="task in column.tasks"
                      :key="task.id"
                      draggable="true"
                      class="cursor-pointer rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      @click="openTaskDetails(task.id)"
                      @dragstart="handleDragStart(task.id)"
                      @dragend="clearDragState"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex flex-wrap gap-2">
                          <span
                            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                            :class="issueTypeClassMap[task.issueType]"
                          >
                            {{ getIssueTypeLabel(task.issueType) }}
                          </span>
                          <span
                            class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                            :class="priorityClassMap[task.priority]"
                          >
                            {{ task.priority }}
                          </span>
                          <span
                            v-if="task.blocked && task.status !== 'done'"
                            class="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700"
                          >
                            Blocked
                          </span>
                        </div>

                        <div class="text-right">
                          <p class="text-[11px] font-semibold text-slate-500">{{ task.id }}</p>
                          <p class="mt-1 text-[11px] text-slate-500">{{ task.storyPoints }} pts</p>
                        </div>
                      </div>

                      <h3 class="mt-3 text-sm font-semibold text-slate-900">{{ task.title }}</h3>
                      <p class="mt-2 text-xs leading-5 text-slate-600">{{ task.description }}</p>

                      <div class="mt-4 flex flex-wrap gap-2">
                        <span
                          class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                          :class="departmentClassMap[task.department]"
                        >
                          {{ getDepartmentLabel(task.department) }}
                        </span>
                        <span
                          class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {{ task.assignee }}
                        </span>
                      </div>

                      <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div class="rounded-xl bg-slate-50 p-3">
                          <p class="text-slate-500">{{ task.referenceLabel }}</p>
                          <p class="mt-1 font-semibold text-slate-900">{{ task.referenceValue }}</p>
                        </div>
                        <div class="rounded-xl bg-slate-50 p-3">
                          <p class="text-slate-500">Due</p>
                          <p class="mt-1 font-semibold text-slate-900">{{ formatDate(task.dueDate) }}</p>
                        </div>
                      </div>

                      <div class="mt-4">
                        <div class="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>Checklist</span>
                          <span>{{ task.checklistDone }}/{{ task.checklistTotal }}</span>
                        </div>
                        <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            class="h-full rounded-full bg-primary-600"
                            :style="{ width: `${getChecklistPercent(task)}%` }"
                          ></div>
                        </div>
                      </div>

                      <div class="mt-4 flex items-center justify-between gap-3">
                        <span
                          class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                          :class="getDueState(task).className"
                        >
                          {{ getDueState(task).label }}
                        </span>

                        <select
                          :value="task.status"
                          class="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none transition focus:border-primary-500"
                          @click.stop
                          @change.stop="moveTaskFromSelect(task.id, $event)"
                        >
                          <option
                            v-for="option in boardStatusOptions"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </option>
                        </select>
                      </div>
                    </article>

                    <div
                      v-if="column.tasks.length === 0"
                      class="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-4 py-10 text-center text-sm text-gray-500"
                    >
                      No sprint issues in this stage for the current filter.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            v-else
            class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm"
          >
            <h2 class="text-lg font-semibold text-slate-900">No active sprint</h2>
            <p class="mt-2 text-sm text-slate-500">
              Plan issues in backlog first, then activate a sprint to populate the board.
            </p>
            <button
              class="mt-5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              @click="openCreateSprintModal"
            >
              Create sprint
            </button>
          </section>
        </template>

        <section v-else class="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-slate-500">Unscheduled backlog</p>
                <h2 class="mt-2 text-xl font-semibold text-slate-900">Issues ready for planning</h2>
                <p class="mt-1 text-sm text-slate-500">
                  These issues are not committed to any sprint yet.
                </p>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {{ unscheduledBacklogTasks.length }}
              </span>
            </div>

            <div class="mt-5 space-y-4">
              <article
                v-for="task in unscheduledBacklogTasks"
                :key="task.id"
                class="rounded-2xl border border-slate-200 p-4"
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap gap-2">
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                        :class="issueTypeClassMap[task.issueType]"
                      >
                        {{ getIssueTypeLabel(task.issueType) }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                        :class="priorityClassMap[task.priority]"
                      >
                        {{ task.priority }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                        :class="departmentClassMap[task.department]"
                      >
                        {{ getDepartmentLabel(task.department) }}
                      </span>
                    </div>

                    <div class="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 class="text-sm font-semibold text-slate-900">{{ task.title }}</h3>
                        <p class="mt-2 text-xs leading-5 text-slate-600">{{ task.description }}</p>
                      </div>
                      <div class="text-right text-[11px] text-slate-500">
                        <p class="font-semibold">{{ task.id }}</p>
                        <p class="mt-1">{{ task.storyPoints }} pts</p>
                      </div>
                    </div>

                    <div class="mt-4 flex flex-wrap gap-2">
                      <span
                        class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {{ task.assignee }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {{ task.referenceLabel }}: {{ task.referenceValue }}
                      </span>
                      <span
                        v-for="tag in task.tags"
                        :key="tag"
                        class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        #{{ tag }}
                      </span>
                    </div>
                  </div>

                  <div class="lg:w-[250px]">
                    <div class="grid grid-cols-2 gap-3 text-xs">
                      <div class="rounded-xl bg-slate-50 p-3">
                        <p class="text-slate-500">Due</p>
                        <p class="mt-1 font-semibold text-slate-900">{{ formatDate(task.dueDate) }}</p>
                      </div>
                      <div class="rounded-xl bg-slate-50 p-3">
                        <p class="text-slate-500">Risk</p>
                        <p class="mt-1 font-semibold text-slate-900">
                          {{ formatCurrency(task.revenueAtRisk) }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-3">
                      <label class="mb-1 block text-sm font-medium text-slate-700">Plan into sprint</label>
                      <select
                        :value="task.sprintId || ''"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                        @change="moveTaskToSprint(task.id, $event)"
                      >
                        <option
                          v-for="option in planningOptions"
                          :key="option.value || 'backlog'"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </div>

                    <button
                      class="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      @click="openTaskDetails(task.id)"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </article>

              <div
                v-if="unscheduledBacklogTasks.length === 0"
                class="rounded-2xl border border-dashed border-gray-300 bg-slate-50 px-4 py-10 text-center text-sm text-gray-500"
              >
                No unscheduled backlog issues match the current filter.
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <section
              v-for="sprint in plannedSprintGroups"
              :key="sprint.id"
              class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                      :class="sprintStateClassMap[sprint.status]"
                    >
                      {{ sprint.status }}
                    </span>
                    <span
                      class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {{ formatSprintRange(sprint) }}
                    </span>
                    <button
                      class="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      @click="openEditSprintModal(sprint)"
                    >
                      Edit sprint
                    </button>
                  </div>
                  <h3 class="mt-3 text-lg font-semibold text-slate-900">{{ sprint.name }}</h3>
                  <p class="mt-2 text-sm leading-6 text-slate-600">{{ sprint.goal }}</p>
                </div>

                <div class="grid grid-cols-2 gap-3 sm:w-[220px]">
                  <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Issues</p>
                    <p class="mt-1 text-lg font-semibold text-slate-900">{{ sprint.tasks.length }}</p>
                  </div>
                  <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Points</p>
                    <p class="mt-1 text-lg font-semibold text-slate-900">
                      {{ getSprintTaskPoints(sprint.tasks) }}/{{ sprint.capacity }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="focus in sprint.focus"
                  :key="focus"
                  class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {{ focus }}
                </span>
              </div>

              <div class="mt-5 space-y-3">
                <article
                  v-for="task in sprint.tasks"
                  :key="task.id"
                  class="rounded-2xl border border-slate-200 p-4"
                >
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap gap-2">
                        <span
                          class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                          :class="issueTypeClassMap[task.issueType]"
                        >
                          {{ getIssueTypeLabel(task.issueType) }}
                        </span>
                        <span
                          class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                          :class="priorityClassMap[task.priority]"
                        >
                          {{ task.priority }}
                        </span>
                        <span
                          class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {{ task.storyPoints }} pts
                        </span>
                      </div>

                      <div class="mt-3 flex items-start justify-between gap-3">
                        <div>
                          <h4 class="text-sm font-semibold text-slate-900">{{ task.title }}</h4>
                          <p class="mt-2 text-xs leading-5 text-slate-600">{{ task.description }}</p>
                        </div>
                        <div class="text-right text-[11px] text-slate-500">
                          <p class="font-semibold">{{ task.id }}</p>
                          <p class="mt-1">{{ getStatusLabel(task.status) }}</p>
                        </div>
                      </div>

                      <div class="mt-4 flex flex-wrap gap-2">
                        <span
                          class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                          :class="departmentClassMap[task.department]"
                        >
                          {{ getDepartmentLabel(task.department) }}
                        </span>
                        <span
                          class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {{ task.assignee }}
                        </span>
                      </div>
                    </div>

                    <div class="sm:w-[240px]">
                      <div class="grid grid-cols-2 gap-3 text-xs">
                        <div class="rounded-xl bg-slate-50 p-3">
                          <p class="text-slate-500">Due</p>
                          <p class="mt-1 font-semibold text-slate-900">{{ formatDate(task.dueDate) }}</p>
                        </div>
                        <div class="rounded-xl bg-slate-50 p-3">
                          <p class="text-slate-500">Risk</p>
                          <p class="mt-1 font-semibold text-slate-900">
                            {{ formatCurrency(task.revenueAtRisk) }}
                          </p>
                        </div>
                      </div>

                      <div class="mt-3">
                        <label class="mb-1 block text-sm font-medium text-slate-700">Re-plan issue</label>
                        <select
                          :value="task.sprintId || ''"
                          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                          @change="moveTaskToSprint(task.id, $event)"
                        >
                          <option
                            v-for="option in planningOptions"
                            :key="option.value || 'backlog'"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </option>
                        </select>
                      </div>

                      <button
                        class="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        @click="openTaskDetails(task.id)"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </article>

                <div
                  v-if="sprint.tasks.length === 0"
                  class="rounded-2xl border border-dashed border-gray-300 bg-slate-50 px-4 py-8 text-center text-sm text-gray-500"
                >
                  No issues are planned into this sprint for the current filter.
                </div>
              </div>
            </section>

            <section
              v-if="lastCompletedSprint && lastCompletedSprintMetrics"
              class="rounded-2xl bg-slate-900 p-5 text-white shadow-sm"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="text-xs uppercase tracking-[0.18em] text-white/60">Last completed sprint</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                      {{ lastCompletedSprint.name }}
                    </span>
                    <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                      {{ formatSprintRange(lastCompletedSprint) }}
                    </span>
                  </div>
                </div>

                <button
                  class="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-white/10"
                  @click="openEditSprintModal(lastCompletedSprint)"
                >
                  Edit sprint
                </button>
              </div>
              <p class="mt-3 text-sm leading-6 text-white/75">{{ lastCompletedSprint.goal }}</p>

              <div class="mt-4 grid grid-cols-3 gap-3">
                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p class="text-xs uppercase tracking-[0.16em] text-white/60">Issues</p>
                  <p class="mt-1 text-xl font-semibold">{{ lastCompletedSprintMetrics.issues }}</p>
                </div>
                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p class="text-xs uppercase tracking-[0.16em] text-white/60">Delivered</p>
                  <p class="mt-1 text-xl font-semibold">
                    {{ lastCompletedSprintMetrics.deliveredPoints }} pts
                  </p>
                </div>
                <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p class="text-xs uppercase tracking-[0.16em] text-white/60">Capacity</p>
                  <p class="mt-1 text-xl font-semibold">{{ lastCompletedSprint.capacity }}</p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>

      <FormModal
        :show="isSpaceModalOpen"
        :title="spaceModalMode === 'create' ? 'Create Space' : 'Edit Space'"
        size="lg"
        @close="closeSpaceModal"
        @submit="submitSpaceForm"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            v-model="spaceForm.key"
            label="Space key"
            placeholder="Example: OPS"
            :error="spaceFormErrors.key"
          />
          <FormInput
            v-model="spaceForm.lead"
            label="Space lead"
            placeholder="Name of owner"
            :error="spaceFormErrors.lead"
          />

          <div class="md:col-span-2">
            <FormInput
              v-model="spaceForm.name"
              label="Space name"
              placeholder="Example: Operations Command"
              :error="spaceFormErrors.name"
            />
          </div>

          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              v-model="spaceForm.description"
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              placeholder="Describe the business domain and what this space owns"
            ></textarea>
            <p class="mt-1 text-xs text-slate-500">
              Use a short uppercase key like Jira. Existing tasks, backlog, and sprints stay scoped
              to this space.
            </p>
          </div>
        </div>
      </FormModal>

      <FormModal
        :show="isCreateModalOpen"
        :title="currentSpace ? `Create Issue in ${currentSpace.key}` : 'Create Issue'"
        size="xl"
        @close="closeCreateModal"
        @submit="submitCreateTask"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div class="md:col-span-2 xl:col-span-3">
            <FormInput
              v-model="createForm.title"
              label="Issue title"
              placeholder="Example: Review failed COD confirmations"
              :error="formErrors.title"
            />
          </div>

          <FormSelect
            v-model="createForm.issueType"
            label="Issue type"
            :options="issueTypeOptions"
          />
          <FormSelect
            v-model="createForm.department"
            label="Team"
            :options="departmentOptions"
          />
          <FormSelect
            v-model="createForm.priority"
            label="Priority"
            :options="priorityOptions"
          />

          <FormInput
            v-model="createForm.assignee"
            label="Assignee"
            placeholder="Name of owner"
            :error="formErrors.assignee"
          />
          <FormInput
            v-model="createForm.dueDate"
            label="Due date"
            type="date"
            :error="formErrors.dueDate"
          />

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Sprint placement</label>
            <select
              v-model="createForm.sprintId"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            >
              <option
                v-for="option in planningOptions"
                :key="option.value || 'backlog'"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <FormSelect
            v-model="createForm.status"
            label="Initial workflow status"
            :options="createStatusOptions"
          />

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Story points</label>
            <input
              v-model.number="createForm.storyPoints"
              type="number"
              min="1"
              class="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              :class="
                formErrors.storyPoints
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300'
              "
            />
            <p v-if="formErrors.storyPoints" class="mt-1 text-sm text-red-600">
              {{ formErrors.storyPoints }}
            </p>
          </div>

          <FormInput
            v-model="createForm.referenceLabel"
            label="Reference label"
            placeholder="Order batch, SKU, Campaign..."
          />

          <div class="md:col-span-2 xl:col-span-3">
            <FormInput
              v-model="createForm.referenceValue"
              label="Reference value"
              placeholder="Example: ORD-2026-211 or Ramadan hero refresh"
            />
          </div>

          <div class="md:col-span-2 xl:col-span-3">
            <label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              v-model="createForm.description"
              rows="4"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              placeholder="Short operational context, acceptance note, or expected result"
            ></textarea>
          </div>

          <div class="md:col-span-2 xl:col-span-3">
            <FormInput
              v-model="createForm.tags"
              label="Tags"
              placeholder="comma separated, for example shipping, delay, courier"
            />
          </div>
        </div>
      </FormModal>

      <FormModal
        :show="isSprintModalOpen"
        :title="
          sprintModalMode === 'create'
            ? currentSpace
              ? `Create Sprint in ${currentSpace.key}`
              : 'Create Sprint'
            : 'Edit Sprint'
        "
        size="lg"
        @close="closeSprintModal"
        @submit="submitSprintForm"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <FormInput
              v-model="sprintForm.name"
              label="Sprint name"
              placeholder="Example: Sprint 26"
              :error="sprintFormErrors.name"
            />
          </div>

          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">Goal</label>
            <textarea
              v-model="sprintForm.goal"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              placeholder="Sprint objective for this business cycle"
            ></textarea>
          </div>

          <FormInput
            v-model="sprintForm.startDate"
            label="Start date"
            type="date"
            :error="sprintFormErrors.startDate"
          />
          <FormInput
            v-model="sprintForm.endDate"
            label="End date"
            type="date"
            :error="sprintFormErrors.endDate"
          />

          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Capacity</label>
            <input
              v-model.number="sprintForm.capacity"
              type="number"
              min="1"
              class="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              :class="
                sprintFormErrors.capacity
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300'
              "
            />
            <p v-if="sprintFormErrors.capacity" class="mt-1 text-sm text-red-600">
              {{ sprintFormErrors.capacity }}
            </p>
          </div>

          <FormSelect
            v-model="sprintForm.status"
            label="Sprint status"
            :options="sprintStatusOptions"
          />

          <div class="md:col-span-2">
            <FormInput
              v-model="sprintForm.focus"
              label="Focus areas"
              placeholder="comma separated, for example dispatch, inventory, qa"
            />
            <p class="mt-1 text-xs text-slate-500">
              Setting a sprint to active will move the current active sprint back to planned.
            </p>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        :show="Boolean(deleteSpaceSummary)"
        title="Delete Space"
        :message="
          deleteSpaceSummary
            ? `Delete ${deleteSpaceSummary.name}? This will remove ${deleteSpaceSummary.issueCount} issues and ${deleteSpaceSummary.sprintCount} sprints in this space.`
            : ''
        "
        confirm-text="Delete space"
        cancel-text="Cancel"
        variant="danger"
        @confirm="confirmDeleteSpace"
        @cancel="closeDeleteSpacePrompt"
      />

      <BaseModal
        :show="Boolean(selectedTask)"
        title="Issue Details"
        size="xl"
        @close="closeTaskDetails"
      >
        <div v-if="selectedTask" class="space-y-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div class="flex flex-wrap gap-2">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="issueTypeClassMap[selectedTask.issueType]"
                >
                  {{ getIssueTypeLabel(selectedTask.issueType) }}
                </span>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="priorityClassMap[selectedTask.priority]"
                >
                  {{ selectedTask.priority }}
                </span>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="departmentClassMap[selectedTask.department]"
                >
                  {{ getDepartmentLabel(selectedTask.department) }}
                </span>
              </div>

              <h2 class="mt-3 text-2xl font-semibold text-slate-900">{{ selectedTask.title }}</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">{{ selectedTask.description }}</p>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="tag in selectedTask.tags"
                  :key="tag"
                  class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:min-w-[240px]">
              <p class="font-medium text-slate-900">Issue key</p>
              <p class="mt-1">{{ selectedTask.id }}</p>
              <p class="mt-3 font-medium text-slate-900">Space</p>
              <p class="mt-1">{{ getSpaceName(selectedTask.spaceId) }}</p>
              <p class="mt-3 font-medium text-slate-900">Sprint</p>
              <p class="mt-1">{{ getSprintName(selectedTask.sprintId) }}</p>
              <p class="mt-3 font-medium text-slate-900">Due</p>
              <p class="mt-1">{{ getDueState(selectedTask).label }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl border border-gray-200 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">Story points</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">{{ selectedTask.storyPoints }}</p>
              <p class="mt-1 text-sm text-slate-600">Sprint effort estimate</p>
            </div>
            <div class="rounded-2xl border border-gray-200 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">Status</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">
                {{ getStatusLabel(selectedTask.status) }}
              </p>
              <p class="mt-1 text-sm text-slate-600">Current workflow position</p>
            </div>
            <div class="rounded-2xl border border-gray-200 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">Orders affected</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">
                {{ selectedTask.ordersAffected }}
              </p>
              <p class="mt-1 text-sm text-slate-600">Customer or order flow touched</p>
            </div>
            <div class="rounded-2xl border border-gray-200 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-gray-400">Revenue at risk</p>
              <p class="mt-2 text-xl font-semibold text-slate-900">
                {{ formatCurrency(selectedTask.revenueAtRisk) }}
              </p>
              <p class="mt-1 text-sm text-slate-600">Potential impact if delayed</p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div class="rounded-2xl border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900">Execution progress</h3>
                <span class="text-sm font-medium text-slate-500">
                  {{ selectedTask.checklistDone }}/{{ selectedTask.checklistTotal }} complete
                </span>
              </div>

              <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-primary-600"
                  :style="{ width: `${getChecklistPercent(selectedTask)}%` }"
                ></div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-sm font-medium text-slate-900">Reference</p>
                  <p class="mt-1 text-sm text-slate-600">{{ selectedTask.referenceLabel }}</p>
                  <p class="mt-1 text-sm font-semibold text-slate-900">
                    {{ selectedTask.referenceValue }}
                  </p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-sm font-medium text-slate-900">Assignee</p>
                  <p class="mt-1 text-sm text-slate-600">{{ selectedTask.assignee }}</p>
                  <p class="mt-2 text-sm font-medium text-slate-900">
                    {{ selectedTask.blocked ? 'Blocked' : 'Clear to proceed' }}
                  </p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-sm font-medium text-slate-900">Created</p>
                  <p class="mt-1 text-sm text-slate-600">{{ formatDate(selectedTask.createdAt) }}</p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-sm font-medium text-slate-900">Completed</p>
                  <p class="mt-1 text-sm text-slate-600">
                    {{
                      selectedTask.completedAt
                        ? formatDate(selectedTask.completedAt)
                        : 'Not completed yet'
                    }}
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-gray-200 p-5">
              <h3 class="text-lg font-semibold text-slate-900">Planning & workflow</h3>
              <div class="mt-4 space-y-4">
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Sprint</label>
                  <select
                    :value="selectedTask.sprintId || ''"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    @change="moveSelectedTaskToSprint"
                  >
                    <option
                      v-for="option in planningOptions"
                      :key="option.value || 'backlog'"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </div>

                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Workflow status</label>
                  <select
                    v-if="selectedTask.sprintId"
                    :value="selectedTask.status"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    @change="moveSelectedTask"
                  >
                    <option
                      v-for="option in boardStatusOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div
                    v-else
                    class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                  >
                    Backlog issues do not appear on the board until they are assigned to a sprint.
                  </div>
                </div>

                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-sm font-medium text-slate-900">Planning rule</p>
                  <p class="mt-1 text-sm leading-6 text-slate-600">
                    Keep new work in backlog until it is committed. Only active sprint work should
                    move across the board.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              v-if="selectedTask && selectedTask.status !== 'done'"
              class="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
              @click="toggleSelectedTaskBlocked"
            >
              {{ selectedTask?.blocked ? 'Mark As Clear' : 'Mark As Blocked' }}
            </button>
            <span v-else class="text-sm text-gray-400">Completed issues cannot be blocked.</span>

            <button
              class="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-800"
              @click="closeTaskDetails"
            >
              Close
            </button>
          </div>
        </template>
      </BaseModal>
    </div>
  </div>
</template>
