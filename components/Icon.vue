<template>
  <component :is="iconComponent" :class="iconClasses" v-bind="$attrs" />
</template>

<script setup>
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  UserIcon,
  LockClosedIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  HomeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/solid'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  solid: {
    type: Boolean,
    default: false
  }
})

const iconMap = {
  // Outline icons
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  'plus': PlusIcon,
  'edit': PencilIcon,
  'delete': TrashIcon,
  'close': XMarkIcon,
  'check': CheckIcon,
  'search': MagnifyingGlassIcon,
  'user': UserIcon,
  'lock': LockClosedIcon,
  'email': EnvelopeIcon,
  'eye': EyeIcon,
  'eye-slash': EyeSlashIcon,
  'home': HomeIcon,
  'settings': Cog6ToothIcon,
  'logout': ArrowRightOnRectangleIcon,
  'menu': Bars3Icon,
  'chat': ChatBubbleLeftRightIcon,
  'clock': ClockIcon,
  // Solid icons
  'check-circle': CheckCircleIcon,
  'x-circle': XCircleIcon,
  'info': InformationCircleIcon
}

const iconComponent = computed(() => {
  return iconMap[props.name] || CheckIcon
})

const iconClasses = computed(() => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }
  return sizeMap[props.size] || sizeMap.md
})
</script>


