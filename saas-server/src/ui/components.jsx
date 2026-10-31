import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as LabelPrimitive from '@radix-ui/react-label'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import * as SelectPrimitive from '@radix-ui/react-select'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Slot } from '@radix-ui/react-slot'

const cx = (...values) => values.filter(Boolean).join(' ')
const CheckIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
const ChevronIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>

export const Button = React.forwardRef(function Button ({ asChild = false, variant = 'default', size = 'default', className, ...props }, ref) {
  const Component = asChild ? Slot : 'button'
  return <Component ref={ref} data-slot="button" data-shadcn-owned="button" data-variant={variant} data-size={size} className={cx('shadcn-button', `shadcn-button-${variant}`, `shadcn-button-${size}`, className)} {...props} />
})

export const Input = React.forwardRef(function Input ({ className, type = 'text', ...props }, ref) {
  return <input ref={ref} type={type} data-slot="input" data-shadcn-owned="input" className={cx('shadcn-input', className)} {...props} />
})

export const Textarea = React.forwardRef(function Textarea ({ className, ...props }, ref) {
  return <textarea ref={ref} data-slot="textarea" data-shadcn-owned="textarea" className={cx('shadcn-textarea', className)} {...props} />
})

export const Label = React.forwardRef(function Label ({ className, ...props }, ref) {
  return <LabelPrimitive.Root ref={ref} data-slot="label" className={cx('shadcn-label', className)} {...props} />
})

export const Checkbox = React.forwardRef(function Checkbox ({ className, children, ...props }, ref) {
  return <CheckboxPrimitive.Root ref={ref} data-slot="checkbox" data-shadcn-owned="checkbox" className={cx('shadcn-checkbox', className)} {...props}>
    <CheckboxPrimitive.Indicator className="shadcn-checkbox-indicator"><CheckIcon /></CheckboxPrimitive.Indicator>
    {children}
  </CheckboxPrimitive.Root>
})

export const Switch = React.forwardRef(function Switch ({ className, ...props }, ref) {
  return <SwitchPrimitive.Root ref={ref} data-slot="switch" data-shadcn-owned="switch" className={cx('shadcn-switch', className)} {...props}>
    <SwitchPrimitive.Thumb className="shadcn-switch-thumb" />
  </SwitchPrimitive.Root>
})

export const RadioGroup = React.forwardRef(function RadioGroup ({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} data-slot="radio-group" className={cx('shadcn-radio-group', className)} {...props} />
})

export const RadioGroupItem = React.forwardRef(function RadioGroupItem ({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Item ref={ref} data-slot="radio-group-item" data-shadcn-owned="radio" className={cx('shadcn-radio', className)} {...props}>
    <RadioGroupPrimitive.Indicator className="shadcn-radio-indicator" />
  </RadioGroupPrimitive.Item>
})

export const Select = SelectPrimitive.Root
export function SelectTrigger ({ className, children, ...props }) {
  return <SelectPrimitive.Trigger data-slot="select-trigger" data-shadcn-owned="select-trigger" className={cx('shadcn-select-trigger', className)} {...props}>
    {children || <SelectPrimitive.Value placeholder="请选择" />}
    <SelectPrimitive.Icon className="shadcn-select-icon"><ChevronIcon /></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
}
export const SelectValue = SelectPrimitive.Value
export function SelectContent ({ className, children, ...props }) {
  return <SelectPrimitive.Portal><SelectPrimitive.Content data-slot="select-content" className={cx('shadcn-select-content', className)} position="popper" sideOffset={5} {...props}>
    <SelectPrimitive.Viewport className="shadcn-select-viewport">{children}</SelectPrimitive.Viewport>
  </SelectPrimitive.Content></SelectPrimitive.Portal>
}
export function SelectItem ({ className, children, ...props }) {
  return <SelectPrimitive.Item data-slot="select-item" className={cx('shadcn-select-item', className)} {...props}>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="shadcn-select-item-check"><CheckIcon /></SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
}

export const Dialog = DialogPrimitive.Root
export function DialogOverlay (props) {
  return <DialogPrimitive.Overlay data-slot="dialog-overlay" className="shadcn-dialog-overlay" {...props} />
}
export function DialogContent ({ className, children, ...props }) {
  return <DialogPrimitive.Portal container={document.getElementById('shadcn-dialog-portal') || document.getElementById('modal-root')}>
    <DialogOverlay />
    <DialogPrimitive.Content data-slot="dialog-content" className={cx('shadcn-dialog-content', className)} {...props}>{children}</DialogPrimitive.Content>
  </DialogPrimitive.Portal>
}
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export const Accordion = AccordionPrimitive.Root
export function AccordionItem ({ className, ...props }) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cx('shadcn-accordion-item', className)} {...props} />
}
export function AccordionTrigger ({ className, children, ...props }) {
  return <AccordionPrimitive.Header className="shadcn-accordion-header"><AccordionPrimitive.Trigger data-slot="accordion-trigger" data-shadcn-owned="accordion-trigger" className={cx('shadcn-accordion-trigger', className)} {...props}>
    {children}<ChevronIcon />
  </AccordionPrimitive.Trigger></AccordionPrimitive.Header>
}
export function AccordionContent ({ className, children, ...props }) {
  return <AccordionPrimitive.Content data-slot="accordion-content" className={cx('shadcn-accordion-content', className)} {...props}>{children}</AccordionPrimitive.Content>
}

export const Tabs = TabsPrimitive.Root
export function TabsList ({ className, ...props }) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cx('shadcn-tabs-list', className)} {...props} />
}
export function TabsTrigger ({ className, ...props }) {
  return <TabsPrimitive.Trigger data-slot="tabs-trigger" data-shadcn-owned="tab" className={cx('shadcn-tabs-trigger', className)} {...props} />
}
export function TabsContent ({ className, ...props }) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cx('shadcn-tabs-content', className)} {...props} />
}

export function Table ({ className, ...props }) { return <div data-slot="table-container" className="shadcn-table-container"><table data-slot="table" className={cx('shadcn-table', className)} {...props} /></div> }
export function TableHeader (props) { return <thead data-slot="table-header" {...props} /> }
export function TableBody (props) { return <tbody data-slot="table-body" {...props} /> }
export function TableRow (props) { return <tr data-slot="table-row" {...props} /> }
export function TableHead (props) { return <th data-slot="table-head" {...props} /> }
export function TableCell (props) { return <td data-slot="table-cell" {...props} /> }

export function Badge ({ variant = 'secondary', className, ...props }) {
  return <span data-slot="badge" data-variant={variant} className={cx('shadcn-badge', `shadcn-badge-${variant}`, className)} {...props} />
}
