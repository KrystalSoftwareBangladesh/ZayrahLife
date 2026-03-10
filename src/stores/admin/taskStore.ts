import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  departmentOptions,
  mockSpaces,
  mockSprints,
  mockTaskBoard,
  type EcommerceTask,
  type Space,
  type Sprint,
  type SprintStatus,
  type TaskDepartment,
  type TaskIssueType,
  type TaskPriority,
  type TaskStatus
} from '@/mock/admin/tasks'

interface CreateTaskPayload {
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
  referenceLabel: string
  referenceValue: string
  tags: string[]
}

interface SprintPayload {
  name: string
  goal: string
  startDate: string
  endDate: string
  capacity: number
  status: SprintStatus
  focus: string[]
}

interface SpacePayload {
  key: string
  name: string
  description: string
  lead: string
}

function cloneTask(task: EcommerceTask): EcommerceTask {
  return {
    ...task,
    tags: [...task.tags]
  }
}

function cloneSprint(sprint: Sprint): Sprint {
  return {
    ...sprint,
    focus: [...sprint.focus]
  }
}

function cloneSpace(space: Space): Space {
  return {
    ...space
  }
}

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isWithinLastDays(dateValue: string, days: number) {
  const target = new Date(`${dateValue}T00:00:00`)
  const today = new Date(`${getTodayKey()}T00:00:00`)

  if (Number.isNaN(target.getTime()) || Number.isNaN(today.getTime())) {
    return false
  }

  const diff = today.getTime() - target.getTime()
  const threshold = days * 24 * 60 * 60 * 1000
  return diff >= 0 && diff <= threshold
}

function buildTaskId(currentCount: number) {
  const nextNumber = 100 + currentCount + 1
  return `TASK-${getTodayKey().split('-').join('')}-${nextNumber}`
}

function buildSprintId(currentSprints: Sprint[]) {
  const nextNumber =
    currentSprints.reduce((maxValue, sprint) => {
      const numericPart = Number.parseInt(sprint.id.replace('SPR-', ''), 10)
      if (Number.isNaN(numericPart)) return maxValue
      return Math.max(maxValue, numericPart)
    }, 0) + 1

  return `SPR-${nextNumber}`
}

function buildSpaceId(spaceKey: string, currentSpaces: Space[]) {
  const baseId = `space-${spaceKey.toLowerCase()}`
  if (!currentSpaces.some(space => space.id === baseId)) {
    return baseId
  }

  let suffix = 2
  while (currentSpaces.some(space => space.id === `${baseId}-${suffix}`)) {
    suffix += 1
  }

  return `${baseId}-${suffix}`
}

function sortByStartDateAsc(a: Sprint, b: Sprint) {
  return a.startDate.localeCompare(b.startDate)
}

function sortByStartDateDesc(a: Sprint, b: Sprint) {
  return b.startDate.localeCompare(a.startDate)
}

function normalizeSprintPayload(payload: SprintPayload) {
  return {
    name: payload.name.trim(),
    goal: payload.goal.trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
    capacity: Math.max(1, Math.round(payload.capacity)),
    status: payload.status,
    focus: Array.from(new Set(payload.focus.map(item => item.trim()).filter(Boolean)))
  }
}

function normalizeSpaceKey(spaceKey: string) {
  return spaceKey.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

function normalizeSpacePayload(payload: SpacePayload) {
  return {
    key: normalizeSpaceKey(payload.key),
    name: payload.name.trim(),
    description: payload.description.trim(),
    lead: payload.lead.trim()
  }
}

export const useTaskStore = defineStore('adminTasks', () => {
  const tasks = ref<EcommerceTask[]>(mockTaskBoard.map(task => cloneTask(task)))
  const sprints = ref<Sprint[]>(mockSprints.map(sprint => cloneSprint(sprint)))
  const spaces = ref<Space[]>(mockSpaces.map(space => cloneSpace(space)))
  const currentSpaceId = ref<string | null>(spaces.value[0]?.id || null)

  const currentSpace = computed(
    () => spaces.value.find(space => space.id === currentSpaceId.value) || null
  )
  const currentSpaceTasks = computed(() =>
    currentSpaceId.value ? tasks.value.filter(task => task.spaceId === currentSpaceId.value) : []
  )
  const currentSpaceSprints = computed(() =>
    currentSpaceId.value ? sprints.value.filter(sprint => sprint.spaceId === currentSpaceId.value) : []
  )

  const activeSprint = computed(
    () => currentSpaceSprints.value.find(sprint => sprint.status === 'active') || null
  )
  const plannedSprints = computed(() =>
    currentSpaceSprints.value
      .filter(sprint => sprint.status === 'planned')
      .slice()
      .sort(sortByStartDateAsc)
  )
  const completedSprints = computed(() =>
    currentSpaceSprints.value
      .filter(sprint => sprint.status === 'completed')
      .slice()
      .sort(sortByStartDateDesc)
  )

  const plannedSprintIds = computed(() => new Set(plannedSprints.value.map(sprint => sprint.id)))
  const activeSprintTasks = computed(() => {
    if (!activeSprint.value) return []
    return currentSpaceTasks.value.filter(task => task.sprintId === activeSprint.value?.id)
  })

  const openTasks = computed(() => activeSprintTasks.value.filter(task => task.status !== 'done').length)
  const urgentTasks = computed(() =>
    activeSprintTasks.value.filter(task => task.status !== 'done' && task.priority === 'urgent').length
  )
  const blockedTasks = computed(() =>
    activeSprintTasks.value.filter(task => task.status !== 'done' && task.blocked).length
  )
  const dueTodayTasks = computed(() =>
    activeSprintTasks.value.filter(task => task.status !== 'done' && task.dueDate === getTodayKey()).length
  )
  const completedThisWeek = computed(() =>
    currentSpaceTasks.value.filter(task => task.completedAt && isWithinLastDays(task.completedAt, 7)).length
  )
  const revenueAtRisk = computed(() =>
    activeSprintTasks.value
      .filter(task => task.status !== 'done')
      .reduce((sum, task) => sum + task.revenueAtRisk, 0)
  )
  const ordersAffected = computed(() =>
    activeSprintTasks.value
      .filter(task => task.status !== 'done')
      .reduce((sum, task) => sum + task.ordersAffected, 0)
  )
  const activeSprintCommittedPoints = computed(() =>
    activeSprintTasks.value.reduce((sum, task) => sum + task.storyPoints, 0)
  )
  const activeSprintDonePoints = computed(() =>
    activeSprintTasks.value
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + task.storyPoints, 0)
  )
  const activeSprintProgress = computed(() => {
    if (activeSprintCommittedPoints.value === 0) return 0
    return Math.round((activeSprintDonePoints.value / activeSprintCommittedPoints.value) * 100)
  })

  const backlogTasks = computed(() => currentSpaceTasks.value.filter(task => task.sprintId === null))
  const backlogTaskCount = computed(() => backlogTasks.value.length)
  const backlogStoryPoints = computed(() =>
    backlogTasks.value.reduce((sum, task) => sum + task.storyPoints, 0)
  )
  const plannedTaskCount = computed(() =>
    currentSpaceTasks.value.filter(task => task.sprintId && plannedSprintIds.value.has(task.sprintId)).length
  )
  const plannedStoryPoints = computed(() =>
    currentSpaceTasks.value
      .filter(task => task.sprintId && plannedSprintIds.value.has(task.sprintId))
      .reduce((sum, task) => sum + task.storyPoints, 0)
  )
  const activeDepartmentLoad = computed(() =>
    departmentOptions
      .map(option => ({
        ...option,
        count: activeSprintTasks.value.filter(
          task => task.status !== 'done' && task.department === option.value
        ).length
      }))
      .filter(option => option.count > 0)
  )

  function getTaskById(taskId: string) {
    return tasks.value.find(task => task.id === taskId) || null
  }

  function getSprintById(sprintId: string) {
    return sprints.value.find(sprint => sprint.id === sprintId) || null
  }

  function getSpaceById(spaceId: string) {
    return spaces.value.find(space => space.id === spaceId) || null
  }

  function setCurrentSpace(spaceId: string) {
    if (!spaces.value.some(space => space.id === spaceId)) return
    currentSpaceId.value = spaceId
  }

  function setSingleActiveSprint(spaceId: string, nextActiveSprintId: string) {
    sprints.value.forEach(sprint => {
      if (sprint.spaceId !== spaceId) return
      if (sprint.id !== nextActiveSprintId && sprint.status === 'active') {
        sprint.status = 'planned'
      }
    })
  }

  function addTask(payload: CreateTaskPayload) {
    if (!currentSpaceId.value) return null

    const todayKey = getTodayKey()
    const sprint = payload.sprintId ? getSprintById(payload.sprintId) : null
    const normalizedSprintId =
      sprint && sprint.spaceId === currentSpaceId.value ? sprint.id : null
    const normalizedStatus = normalizedSprintId
      ? payload.status === 'backlog'
        ? 'todo'
        : payload.status
      : 'backlog'
    const storyPoints = Math.max(1, Math.round(payload.storyPoints))

    const newTask: EcommerceTask = {
      id: buildTaskId(tasks.value.length),
      spaceId: currentSpaceId.value,
      title: payload.title.trim(),
      description: payload.description.trim(),
      department: payload.department,
      priority: payload.priority,
      issueType: payload.issueType,
      status: normalizedStatus,
      sprintId: normalizedSprintId,
      storyPoints,
      assignee: payload.assignee.trim(),
      dueDate: payload.dueDate,
      createdAt: todayKey,
      completedAt: normalizedStatus === 'done' ? todayKey : null,
      referenceLabel: payload.referenceLabel.trim() || 'Workflow',
      referenceValue: payload.referenceValue.trim() || 'General issue',
      tags: payload.tags.filter(Boolean),
      blocked: false,
      checklistDone: normalizedStatus === 'done' ? 3 : 0,
      checklistTotal: 3,
      ordersAffected: 0,
      revenueAtRisk: 0
    }

    tasks.value.unshift(newTask)
    return newTask
  }

  function addSprint(payload: SprintPayload) {
    if (!currentSpaceId.value) return null

    const normalizedPayload = normalizeSprintPayload(payload)
    const newSprint: Sprint = {
      id: buildSprintId(sprints.value),
      spaceId: currentSpaceId.value,
      ...normalizedPayload
    }

    if (newSprint.status === 'active') {
      setSingleActiveSprint(newSprint.spaceId, newSprint.id)
    }

    sprints.value.unshift(newSprint)
    return newSprint
  }

  function updateSprint(sprintId: string, payload: SprintPayload) {
    const sprint = sprints.value.find(entry => entry.id === sprintId)
    if (!sprint) return null

    const normalizedPayload = normalizeSprintPayload(payload)

    if (normalizedPayload.status === 'active') {
      setSingleActiveSprint(sprint.spaceId, sprintId)
    }

    sprint.name = normalizedPayload.name
    sprint.goal = normalizedPayload.goal
    sprint.startDate = normalizedPayload.startDate
    sprint.endDate = normalizedPayload.endDate
    sprint.capacity = normalizedPayload.capacity
    sprint.status = normalizedPayload.status
    sprint.focus = normalizedPayload.focus

    return sprint
  }

  function addSpace(payload: SpacePayload) {
    const normalizedPayload = normalizeSpacePayload(payload)
    if (!normalizedPayload.key) return null

    const newSpace: Space = {
      id: buildSpaceId(normalizedPayload.key, spaces.value),
      ...normalizedPayload
    }

    spaces.value.unshift(newSpace)
    currentSpaceId.value = newSpace.id
    return newSpace
  }

  function updateSpace(spaceId: string, payload: SpacePayload) {
    const space = spaces.value.find(entry => entry.id === spaceId)
    if (!space) return null

    const normalizedPayload = normalizeSpacePayload(payload)
    if (!normalizedPayload.key) return null

    space.key = normalizedPayload.key
    space.name = normalizedPayload.name
    space.description = normalizedPayload.description
    space.lead = normalizedPayload.lead

    return space
  }

  function deleteSpace(spaceId: string) {
    if (spaces.value.length <= 1) return false
    if (!spaces.value.some(space => space.id === spaceId)) return false

    spaces.value = spaces.value.filter(space => space.id !== spaceId)
    sprints.value = sprints.value.filter(sprint => sprint.spaceId !== spaceId)
    tasks.value = tasks.value.filter(task => task.spaceId !== spaceId)

    if (currentSpaceId.value === spaceId) {
      currentSpaceId.value = spaces.value[0]?.id || null
    }

    return true
  }

  function assignTaskToSprint(taskId: string, nextSprintId: string | null) {
    const task = tasks.value.find(entry => entry.id === taskId)
    if (!task) return

    if (!nextSprintId) {
      task.sprintId = null
      task.status = 'backlog'
      task.completedAt = null
      return
    }

    const sprint = getSprintById(nextSprintId)
    if (!sprint || sprint.spaceId !== task.spaceId) return

    task.sprintId = sprint.id

    if (task.status === 'backlog') {
      task.status = 'todo'
    }
  }

  function moveTask(taskId: string, nextStatus: TaskStatus) {
    const task = tasks.value.find(entry => entry.id === taskId)
    if (!task) return

    if (nextStatus === 'backlog') {
      assignTaskToSprint(taskId, null)
      return
    }

    if (!task.sprintId) {
      const fallbackSprintId =
        sprints.value.find(sprint => sprint.spaceId === task.spaceId && sprint.status === 'active')?.id ||
        null
      if (!fallbackSprintId) return
      task.sprintId = fallbackSprintId
    }

    if (task.status === nextStatus) return

    task.status = nextStatus
    task.completedAt = nextStatus === 'done' ? getTodayKey() : null

    if (nextStatus === 'done') {
      task.blocked = false
      task.checklistDone = task.checklistTotal
    }
  }

  function setTaskBlocked(taskId: string, isBlocked: boolean) {
    const task = tasks.value.find(entry => entry.id === taskId)
    if (!task || task.status === 'done') return
    task.blocked = isBlocked
  }

  return {
    tasks,
    sprints,
    spaces,
    currentSpaceId,
    currentSpace,
    currentSpaceTasks,
    currentSpaceSprints,
    activeSprint,
    plannedSprints,
    completedSprints,
    activeSprintTasks,
    openTasks,
    urgentTasks,
    blockedTasks,
    dueTodayTasks,
    completedThisWeek,
    revenueAtRisk,
    ordersAffected,
    activeSprintCommittedPoints,
    activeSprintDonePoints,
    activeSprintProgress,
    backlogTasks,
    backlogTaskCount,
    backlogStoryPoints,
    plannedTaskCount,
    plannedStoryPoints,
    activeDepartmentLoad,
    getTaskById,
    getSprintById,
    getSpaceById,
    setCurrentSpace,
    addTask,
    addSprint,
    updateSprint,
    addSpace,
    updateSpace,
    deleteSpace,
    assignTaskToSprint,
    moveTask,
    setTaskBlocked
  }
})
