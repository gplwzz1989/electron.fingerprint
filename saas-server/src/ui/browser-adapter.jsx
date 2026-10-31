import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal, flushSync } from 'react-dom'
import { toast, Toaster } from 'sonner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogTitle, Input, RadioGroup, RadioGroupItem, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from './components'

const roots = new WeakMap()
const radioGroups = new Map()
const radioRendererByHost = new WeakMap()
const radioOwnerIds = new WeakMap()
let observer
let dialogRoot
let activeDialogId = ''
let nextDialogId = 0
let toasterRoot
let adminTabsRoot
let adminTabsHost
let adminTabsTarget
let nextRadioOwnerId = 0

function dispatch (node, type) { node.dispatchEvent(new Event(type, { bubbles: true })) }
function controlClasses (node) { return node.className || '' }
function radioGroupKey (node) {
  const owner = node.closest('.payment-methods') || node.form || node.parentElement?.parentElement || document
  if (!radioOwnerIds.has(owner)) radioOwnerIds.set(owner, ++nextRadioOwnerId)
  return `${node.name || ''}:${radioOwnerIds.get(owner)}`
}
function controlProps (node, skip = []) {
  const props = {}
  const aliases = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', maxlength: 'maxLength', minlength: 'minLength', readonly: 'readOnly', autocomplete: 'autoComplete', autocapitalize: 'autoCapitalize', inputmode: 'inputMode', spellcheck: 'spellCheck', rowspan: 'rowSpan', colspan: 'colSpan' }
  const ignored = new Set(['value', 'checked', 'selected', 'style', 'class', 'title', ...skip])
  for (const attribute of node.attributes) {
    if (ignored.has(attribute.name)) continue
    const key = aliases[attribute.name] || attribute.name
    if (['disabled', 'required', 'multiple', 'readOnly', 'hidden', 'autoFocus', 'formNoValidate'].includes(key)) props[key] = true
    else props[key] = attribute.value
  }
  return props
}
function allMatching (root, selector) {
  const matches = root.nodeType === Node.ELEMENT_NODE && root.matches(selector) ? [root] : []
  matches.push(...root.querySelectorAll(selector))
  return matches
}
function hostFor (node, type) {
  const host = document.createElement('span')
  host.className = `shadcn-control-host shadcn-control-host-${type}`
  host.dataset.shadcnHost = type
  node.replaceWith(host)
  return host
}
function renderInto (host, component) {
  const root = createRoot(host)
  roots.set(host, root)
  flushSync(() => root.render(component))
  return root
}
function changeLabelTarget (node, id) {
  if (!id) return ''
  const wrapping = node.closest('label')
  const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`)
  const label = wrapping || explicit
  if (!label) return ''
  label.removeAttribute('for')
  if (!label.id) label.id = `${id}-label`
  return label.id
}
function labelText (node, id) {
  const label = node.closest('label') || (id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null)
  return label?.textContent?.trim() || node.getAttribute('aria-label') || ''
}
function ControlSource ({ node }) {
  const ref = React.useCallback(host => { if (host && node.parentElement !== host) host.append(node) }, [node])
  return <span className="shadcn-control-source" aria-hidden="true" ref={ref} />
}

function RadioControl ({ name, groupKey, value, selected, disabled, label, source, register }) {
  const [current, setCurrent] = React.useState(selected)
  React.useLayoutEffect(() => {
    const sync = () => setCurrent(register().value)
    source.addEventListener('shadcn:sync', sync)
    return () => source.removeEventListener('shadcn:sync', sync)
  }, [source, register])
  return <RadioGroup value={current} onValueChange={next => register().select(next)} aria-label={label}>
    <RadioGroupItem value={value} disabled={disabled} aria-label={label} onKeyDown={event => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return
      const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`)).filter(input => !input.disabled && input.closest('[data-shadcn-host]')?.dataset.shadcnRadioKey === groupKey)
      const index = radios.indexOf(source); const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
      const next = radios[(index + direction + radios.length) % radios.length]
      event.preventDefault(); next?.closest('[data-shadcn-host]')?.querySelector('[data-slot="radio-group-item"]')?.focus()
      if (next) { register().select(next.value) }
    }} />
    <ControlSource node={source} />
  </RadioGroup>
}

function installRadio (node, initialSelection = '') {
  const name = node.name || `radio-${nextDialogId++}`
  const groupKey = radioGroupKey(node)
  const value = node.value || 'on'
  const selected = Boolean(node.checked)
  const label = node.closest('label')?.textContent?.trim() || node.getAttribute('aria-label') || value
  const props = controlProps(node, ['type', 'name', 'value', 'checked'])
  const source = node.cloneNode(false)
  source.className = `${source.className} shadcn-control-source-radio`.trim()
  source.setAttribute('aria-hidden', 'true'); source.tabIndex = -1
  const group = radioGroups.get(groupKey) || { value: initialSelection, sources: new Set(), renderers: new Set() }
  if (selected) group.value = value
  group.sources.add(source)
  radioGroups.set(groupKey, group)
  const register = () => ({
    value: group.value,
    select: next => {
      group.value = next
      for (const item of group.sources) {
        item.checked = item.value === next
        dispatch(item, 'input'); dispatch(item, 'change')
      }
      for (const render of group.renderers) render()
    }
  })
  const host = hostFor(node, 'radio')
  const id = props.id || ''
  const labelId = changeLabelTarget(node, id)
  delete props.id; delete props['aria-label']
  const root = createRoot(host)
  const render = () => flushSync(() => root.render(<RadioControl name={name} groupKey={groupKey} value={value} selected={group.value} disabled={Boolean(props.disabled)} label={label} source={source} register={register} />))
  roots.set(host, root); group.renderers.add(render)
  radioRendererByHost.set(host, render)
  host.dataset.shadcnRadioKey = groupKey
  flushSync(render)
  Object.assign(source, { value, checked: selected, name })
  if (id) source.id = id
  for (const [key, val] of Object.entries(props)) if (key.startsWith('data-')) source.setAttribute(key, val)
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked').set
  const getter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked').get
  Object.defineProperty(source, 'checked', { configurable: true, get: () => getter.call(source), set: next => { setter.call(source, next); group.value = next ? value : group.value; source.dispatchEvent(new Event('shadcn:sync')) } })
  if (labelId) host.querySelector('[data-slot="radio-group-item"]')?.setAttribute('aria-labelledby', labelId)
}

function SelectControl ({ source, label, labelId, booleanSwitch = false }) {
  const readValue = () => source.value === '' ? '' : source.value
  const [value, setValue] = React.useState(readValue)
  const [disabled, setDisabled] = React.useState(source.disabled)
  React.useLayoutEffect(() => {
    const sync = () => { setValue(readValue()); setDisabled(source.disabled) }
    source.addEventListener('shadcn:sync', sync)
    return () => source.removeEventListener('shadcn:sync', sync)
  }, [source])
  const options = Array.from(source.options).map((option, index) => ({ value: option.value === '' ? `__shadcn_empty_${index}` : option.value, actualValue: option.value, label: option.textContent, disabled: option.disabled }))
  const selected = options.find(option => option.actualValue === value)
  const update = next => {
    const option = options.find(item => item.value === next)
    const actualValue = option ? option.actualValue : next === 'true' ? 'true' : 'false'
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
    setter.call(source, actualValue); setValue(actualValue); dispatch(source, 'input'); dispatch(source, 'change')
  }
  return <div className="shadcn-select-control" data-shadcn-select>
    {booleanSwitch
      ? <Switch aria-label={label} aria-labelledby={labelId} checked={value === 'true'} disabled={disabled} onCheckedChange={checked => update(String(checked))} />
      : <Select value={selected?.value || ''} onValueChange={update} disabled={disabled}>
        <SelectTrigger aria-label={label || undefined} aria-labelledby={labelId || undefined}><SelectValue placeholder={selected?.label || '请选择'} /></SelectTrigger>
        <SelectContent>{options.filter(option => option.value !== '').map(option => <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>)}</SelectContent>
      </Select>}
    <ControlSource node={source} />
  </div>
}

function installSelect (node) {
  const props = controlProps(node, ['id', 'name', 'value', 'required', 'multiple', 'disabled'])
  const id = node.id
  const labelId = changeLabelTarget(node, id)
  const source = node.cloneNode(true)
  source.className = `${source.className} shadcn-control-source-select`.trim()
  source.setAttribute('aria-hidden', 'true'); source.tabIndex = -1
  const isBoolean = source.options.length === 2 && new Set(Array.from(source.options).map(item => item.value)).size === 2 && Array.from(source.options).every(item => ['true', 'false'].includes(item.value))
  const host = hostFor(node, 'select')
  renderInto(host, <SelectControl source={source} label={props['aria-label'] || labelText(node, id)} labelId={labelId} booleanSwitch={isBoolean} />)
  const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')
  const disabledDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'disabled')
  Object.defineProperty(source, 'value', { configurable: true, get: () => valueDescriptor.get.call(source), set: next => { valueDescriptor.set.call(source, next); source.dispatchEvent(new Event('shadcn:sync')) } })
  Object.defineProperty(source, 'disabled', { configurable: true, get: () => disabledDescriptor.get.call(source), set: next => { disabledDescriptor.set.call(source, next); source.dispatchEvent(new Event('shadcn:sync')) } })
  if (id) source.id = id
  host.append(source)
  const trigger = host.querySelector('[data-slot="select-trigger"], [data-slot="switch"]')
  if (trigger && labelId) trigger.setAttribute('aria-labelledby', labelId)
  for (const [key, value] of Object.entries(props)) if (key.startsWith('data-')) source.setAttribute(key, value)
}

function installCheckbox (node) {
  const props = controlProps(node, ['type', 'id', 'name', 'value', 'checked', 'disabled'])
  const source = node.cloneNode(false)
  source.className = `${source.className} shadcn-control-source-checkbox`.trim()
  source.setAttribute('aria-hidden', 'true'); source.tabIndex = -1
  const checkedDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')
  const originalChecked = node.checked
  let setChecked
  function CheckboxControl () {
    const [checked, setValue] = React.useState(originalChecked)
    setChecked = setValue
    React.useLayoutEffect(() => {
      const sync = () => setValue(checkedDescriptor.get.call(source))
      source.addEventListener('shadcn:sync', sync)
      return () => source.removeEventListener('shadcn:sync', sync)
    }, [])
    const update = value => {
      const next = value === true
      checkedDescriptor.set.call(source, next)
      setValue(next); dispatch(source, 'input'); dispatch(source, 'change')
    }
    return <><Checkbox checked={checked} disabled={Boolean(props.disabled)} onCheckedChange={update} aria-label={props['aria-label'] || undefined} aria-labelledby={labelId || undefined} />
      <ControlSource node={source} /></>
  }
  const host = hostFor(node, 'checkbox')
  const id = node.id; const labelId = changeLabelTarget(node, id)
  renderInto(host, <CheckboxControl />)
  if (id) source.id = id
  source.value = node.value
  source.checked = originalChecked
  if (node.name) source.name = node.name
  for (const [key, val] of Object.entries(props)) if (key.startsWith('data-')) source.setAttribute(key, val)
  Object.defineProperty(source, 'checked', { configurable: true, get: () => checkedDescriptor.get.call(source), set: value => { checkedDescriptor.set.call(source, value); setChecked?.(Boolean(value)) } })
  if (labelId) host.querySelector('[data-slot="checkbox"]')?.setAttribute('aria-labelledby', labelId)
}

function installInput (node) {
  if (node.type === 'radio') return installRadio(node)
  if (node.type === 'checkbox') return installCheckbox(node)
  const props = controlProps(node, ['type', 'id', 'name', 'value', 'disabled', 'required', 'multiple', 'checked'])
  const id = node.id
  const labelId = changeLabelTarget(node, id)
  const host = hostFor(node, 'input')
  const root = createRoot(host)
  root.render(<Input {...props} id={id} name={node.name || undefined} disabled={node.disabled} required={node.required} multiple={node.multiple} aria-labelledby={props['aria-label'] ? undefined : labelId || undefined} type={node.type || 'text'} defaultValue={node.value} defaultChecked={node.checked} data-shadcn-native="true" />)
  roots.set(host, root)
}

function installTextarea (node) {
  const props = controlProps(node, ['id', 'name', 'value', 'disabled', 'required'])
  const labelId = changeLabelTarget(node, node.id)
  const host = hostFor(node, 'textarea')
  renderInto(host, <Textarea {...props} id={node.id} aria-labelledby={props['aria-label'] ? undefined : labelId || undefined} defaultValue={node.value} data-shadcn-native="true" />)
}

function installButton (node) {
  if (node.closest('[data-slot="alert-dialog-content"], [data-slot="dialog-content"]') && node.matches('.shadcn-dialog-button')) return
  const props = controlProps(node, ['class'])
  const legacyClass = controlClasses(node)
  const variant = /\b(danger|destructive)\b/.test(legacyClass) ? 'destructive' : /\b(primary)\b/.test(legacyClass) ? 'default' : /\b(row-action|quiet|secondary)\b/.test(legacyClass) ? 'ghost' : 'outline'
  const innerHTML = node.innerHTML
  const host = hostFor(node, 'button')
  renderInto(host, <Button {...props} variant={variant} className={legacyClass} data-shadcn-native="true" dangerouslySetInnerHTML={{ __html: innerHTML }} />)
}

function installButtonLink (node) {
  if (node.dataset.shadcnOwned) return
  const props = controlProps(node, ['class'])
  const legacyClass = controlClasses(node)
  const variant = /\b(danger|destructive)\b/.test(legacyClass) ? 'destructive' : /\b(primary)\b/.test(legacyClass) ? 'default' : /\b(row-action|quiet|secondary)\b/.test(legacyClass) ? 'ghost' : 'outline'
  const innerHTML = node.innerHTML
  const host = hostFor(node, 'button-link')
  renderInto(host, <Button asChild {...props} variant={variant} className={legacyClass}>
    <a {...props} data-shadcn-native="true" dangerouslySetInnerHTML={{ __html: innerHTML }} />
  </Button>)
}

function installAccordion (node) {
  const summary = node.querySelector(':scope > summary')
  if (!summary) return
  const heading = summary.innerHTML
  const content = Array.from(node.childNodes).filter(child => child !== summary).map(child => child.outerHTML || child.textContent).join('')
  const key = node.dataset.groupKey || `section-${nextDialogId++}`
  const host = hostFor(node, 'accordion')
  renderInto(host, <Accordion type="single" collapsible defaultValue={node.open ? key : ''} onValueChange={value => {
    node.open = value === key
    document.dispatchEvent(new CustomEvent('workspace:accordion-toggle', { detail: { key, open: node.open } }))
  }}>
    <AccordionItem value={key} className={controlClasses(node)}>
      <AccordionTrigger><span dangerouslySetInnerHTML={{ __html: heading }} /></AccordionTrigger>
      <AccordionContent><div className="shadcn-accordion-fields" dangerouslySetInnerHTML={{ __html: content }} /></AccordionContent>
    </AccordionItem>
  </Accordion>)
  host.dataset.groupKey = key
  host.classList.add('shadcn-accordion-host')
}

function enhance (root = document) {
  const accordionNodes = allMatching(root, 'details:not([data-shadcn-owned])')
  for (const node of accordionNodes) if (!node.closest('[data-shadcn-host]')) installAccordion(node)
  for (const nav of allMatching(root, 'nav.form-categories:not([data-shadcn-ready])')) {
    nav.dataset.shadcnReady = 'true'
    installFormTabs(nav)
  }
  const radios = allMatching(root, 'input[type="radio"]:not([data-shadcn-native]):not([data-shadcn-source])')
  const selectedRadios = new Map(radios.filter(node => node.checked).map(node => [radioGroupKey(node), node.value || 'on']))
  for (const node of allMatching(root, 'a.button:not([data-shadcn-native]), button:not([data-shadcn-native]):not([data-shadcn-owned]), input:not([data-shadcn-native]):not([data-shadcn-source]), textarea:not([data-shadcn-native]), select:not([data-shadcn-native]):not([data-shadcn-source])')) {
    if (node.closest('[data-shadcn-host], [data-shadcn-source], [data-shadcn-root], [data-sonner-toaster], [data-sonner-toast], [data-slot="alert-dialog-content"]')) continue
    if (node.matches('button.shadcn-dialog-button')) continue
    if (node.tagName === 'A') installButtonLink(node)
    else if (node.tagName === 'BUTTON') installButton(node)
    else if (node.tagName === 'TEXTAREA') installTextarea(node)
    else if (node.tagName === 'SELECT') installSelect(node)
    else if (node.type === 'radio') installRadio(node, selectedRadios.get(radioGroupKey(node)) || '')
    else installInput(node)
  }
  for (const table of allMatching(root, 'table:not([data-slot="table"])')) { table.dataset.slot = 'table'; table.classList.add('shadcn-table') }
  for (const label of allMatching(root, 'label:not([data-slot="label"])')) { label.dataset.slot = 'label'; label.classList.add('shadcn-label') }
  for (const card of allMatching(root, '.surface:not([data-slot="card"])')) { card.dataset.slot = 'card'; card.classList.add('shadcn-card') }
  for (const alert of allMatching(root, '.notice:not([data-slot="alert"])')) { alert.dataset.slot = 'alert'; alert.classList.add('shadcn-alert') }
  for (const badge of allMatching(root, '.status-valid:not([data-slot="badge"]),.status-error:not([data-slot="badge"])')) {
    badge.dataset.slot = 'badge'; badge.dataset.variant = badge.classList.contains('status-error') ? 'destructive' : 'success'
    badge.classList.add('shadcn-badge', `shadcn-badge-${badge.dataset.variant}`)
  }
}

function DialogMarkup ({ markup, className, id, title, description, trigger, onClose }) {
  return <Dialog open onOpenChange={open => { if (!open && activeDialogId === id) onClose?.() }}>
    <DialogContent className={`shadcn-page-dialog ${className || ''}`} onOpenAutoFocus={event => {
      event.preventDefault()
      queueMicrotask(() => (document.querySelector('#modal-root .signin-form input[type="email"], #modal-root .platform-picker-close, #modal-root input:not([type="hidden"]), #modal-root [data-slot="select-trigger"]'))?.focus())
    }} onCloseAutoFocus={event => { event.preventDefault() }}>
      <DialogTitle className="shadcn-visually-hidden">{title || '工作空间操作'}</DialogTitle>
      <DialogDescription className="shadcn-visually-hidden">{description || title || '工作空间操作'}</DialogDescription>
      <div className="shadcn-dialog-markup" dangerouslySetInnerHTML={{ __html: markup }} />
    </DialogContent>
  </Dialog>
}

function TabPanelSlot ({ panel }) {
  const ref = React.useCallback(host => { if (host && panel.parentElement !== host) host.append(panel) }, [panel])
  return <div className="shadcn-admin-tab-panel" ref={ref} />
}

function FormTabsRoot ({ items, value, target }) {
  const [selected, setSelected] = React.useState(value)
  return <Tabs value={selected} onValueChange={setSelected}>
    <TabsList aria-label={items[0]?.navLabel || '表单分类'} className="shadcn-form-tabs-list">
      {items.map(item => <TabsTrigger key={item.value} value={item.value} data-form-category={item.value} data-form-scope={item.scope}>{item.label}</TabsTrigger>)}
    </TabsList>
    {target && items.map(item => createPortal(<TabsContent forceMount key={item.value} value={item.value} className="shadcn-form-tab-content">
      <TabPanelSlot panel={item.panel} />
    </TabsContent>, target))}
  </Tabs>
}

function installFormTabs (nav) {
  const parent = nav.parentElement
  const controls = Array.from(nav.querySelectorAll('[data-form-category]'))
  if (!parent || !controls.length) return
  const scope = controls[0].dataset.formScope
  const panels = Array.from(parent.querySelectorAll('[data-group-panel]')).filter(panel => panel.dataset.formScope === scope)
  if (!panels.length) return
  const items = controls.map(control => ({
    value: control.dataset.formCategory,
    scope,
    navLabel: nav.getAttribute('aria-label') || '表单分类',
    label: control.textContent,
    panel: panels.find(panel => panel.dataset.groupPanel === control.dataset.formCategory)
  })).filter(item => item.panel)
  if (!items.length) return
  const host = document.createElement('span'); host.className = 'shadcn-form-tabs-host'; host.dataset.shadcnHost = 'form-tabs'
  nav.replaceWith(host)
  const root = createRoot(host); roots.set(host, root)
  const selected = controls.find(item => item.getAttribute('aria-pressed') === 'true')?.dataset.formCategory || items[0].value
  flushSync(() => root.render(<FormTabsRoot items={items} value={selected} target={parent} />))
}

function AdminTabsRoot ({ items, value, onValueChange, target }) {
  const [selected, setSelected] = React.useState(value)
  React.useEffect(() => setSelected(value), [value])
  return <Tabs value={selected} orientation="vertical" onValueChange={next => { setSelected(next); onValueChange(next) }}>
    <TabsList aria-label="系统设置分类" className="shadcn-admin-tabs-list">
      {items.map(item => <TabsTrigger key={item.value} value={item.value} data-group={item.value}>
        <span className="nav-number">{item.number}</span>{item.label}
      </TabsTrigger>)}
    </TabsList>
    {target && items.map(item => React.createElement(React.Fragment, { key: item.value },
      createPortal(<TabsContent forceMount value={item.value} id={`settings-panel-${item.number}`} className="shadcn-admin-tab-content">
        <TabPanelSlot panel={item.panel} />
      </TabsContent>, target)
    ))}
  </Tabs>
}

function createAdminTabs (items, value, onValueChange) {
  clearAdminTabs()
  const host = document.createElement('span')
  host.className = 'shadcn-admin-tabs-host'
  adminTabsHost = host
  adminTabsTarget = document.getElementById('settings-panels')
  adminTabsRoot = createRoot(host)
  flushSync(() => adminTabsRoot.render(<AdminTabsRoot items={items} value={value} onValueChange={onValueChange} target={adminTabsTarget} />))
  return host
}

function clearAdminTabs () {
  if (adminTabsRoot) { adminTabsRoot.unmount(); adminTabsRoot = null }
  if (adminTabsHost?.isConnected) adminTabsHost.remove()
  adminTabsHost = null
  if (adminTabsTarget) adminTabsTarget.replaceChildren()
  adminTabsTarget = null
}

function extractDialogMarkup (html) {
  const template = document.createElement('template'); template.innerHTML = html
  const section = template.content.querySelector('.platform-picker')
  if (!section) throw new Error('弹窗内容无效，无法加载页面组件。')
  const title = section.querySelector('h2')?.textContent?.trim() || '工作空间操作'
  const description = section.querySelector('header p')?.textContent?.trim() || title
  section.removeAttribute('role'); section.removeAttribute('aria-modal'); section.removeAttribute('aria-labelledby'); section.removeAttribute('aria-describedby')
  return { markup: section.innerHTML, className: section.className, title, description }
}

function showDialog (html, trigger, onClose) {
  const parsed = extractDialogMarkup(html)
  if (!dialogRoot) {
    const container = document.getElementById('modal-root')
    const mount = document.createElement('span'); mount.dataset.shadcnRoot = 'dialog-state'; mount.hidden = true
    const portal = document.createElement('div'); portal.id = 'shadcn-dialog-portal'
    container.append(mount, portal)
    dialogRoot = createRoot(mount)
  }
  const id = `dialog-${++nextDialogId}`
  activeDialogId = id
  document.documentElement.style.setProperty('--shadcn-dialog-content-left', innerWidth >= 640 ? `${Math.max(0, document.querySelector('.shell')?.getBoundingClientRect().left || 0)}px` : '0px')
  flushSync(() => dialogRoot.render(<DialogMarkup {...parsed} id={id} trigger={trigger} onClose={onClose} />))
  return document.querySelector('#modal-root .platform-picker')
}

function closeDialog () {
  activeDialogId = ''
  if (dialogRoot) flushSync(() => dialogRoot.render(null))
}
function isDialogOpen () { return Boolean(document.querySelector('#shadcn-dialog-portal [data-slot="dialog-content"]')) }

function ButtonHost ({ props, children, refValue }) {
  return <Button ref={refValue} {...props} data-shadcn-native="true">{children}</Button>
}

function InputHost ({ props, refValue }) {
  if (props.type === 'checkbox') return <><Checkbox ref={refValue} defaultChecked={props.checked} disabled={props.disabled} data-shadcn-native="true" /><input type="checkbox" data-shadcn-source="true" aria-hidden="true" tabIndex={-1} /></>
  if (props.type === 'select') return null
  if (props.type === 'textarea') return <Textarea ref={refValue} data-shadcn-native="true" />
  return <Input ref={refValue} {...props} data-shadcn-native="true" />
}

function createImperative (tag, options = {}) {
  const host = document.createElement('span')
  host.className = `shadcn-control-host shadcn-control-host-${tag}`
  host.dataset.shadcnHost = tag
  let control = null
  let source = null
  let value = options.value ?? ''
  let checked = Boolean(options.checked)
  let setSelectedValue
  let setCheckedValue
  const props = { ...(options.props || {}) }
  if (tag === 'select') {
    source = document.createElement('select'); source.className = 'shadcn-control-source-select'; source.setAttribute('aria-hidden', 'true'); source.tabIndex = -1
    const items = options.items || []
    for (const item of items) { const option = document.createElement('option'); option.value = item.value; option.textContent = item.label; source.append(option) }
    source.value = String(value)
    function SelectHost () {
      const [selected, setSelected] = React.useState(String(value))
      setSelectedValue = setSelected
      return <Select value={selected} onValueChange={next => {
        value = next; source.value = next; setSelected(next); dispatch(source, 'input'); dispatch(source, 'change')
      }}>
        <SelectTrigger aria-label={options.label || ''}><SelectValue /></SelectTrigger>
        <SelectContent>{items.map(item => <SelectItem key={item.value} value={item.value} disabled={item.disabled}>{item.label}</SelectItem>)}</SelectContent>
      </Select>
    }
  renderInto(host, <SelectHost />); host.append(source)
  } else if (tag === 'textarea') {
    renderInto(host, <Textarea {...props} defaultValue={value} data-shadcn-native="true" ref={node => { control = node }} />)
  } else if (tag === 'checkbox') {
    function CheckboxHost () {
      const [selected, setSelected] = React.useState(checked)
      setCheckedValue = setSelected
      return <Checkbox checked={selected} onCheckedChange={next => { checked = next === true; setSelected(checked); source.checked = checked; dispatch(source, 'input'); dispatch(source, 'change') }} disabled={props.disabled} aria-label={options.label || ''} data-shadcn-native="true" ref={node => { control = node }} />
    }
    source = document.createElement('input'); source.type = 'checkbox'; source.className = 'shadcn-control-source-checkbox'; source.setAttribute('aria-hidden', 'true'); source.tabIndex = -1; source.checked = checked
    renderInto(host, <CheckboxHost />); host.append(source)
  } else if (tag === 'radio') {
    const sourceNode = document.createElement('input'); sourceNode.type = 'radio'; sourceNode.className = 'shadcn-control-source-radio'; sourceNode.setAttribute('aria-hidden', 'true'); sourceNode.tabIndex = -1
    source = sourceNode
    const radioValue = String(options.value ?? 'on')
    renderInto(host, <RadioGroup value={checked ? radioValue : ''}><RadioGroupItem value={radioValue} disabled={props.disabled} aria-label={options.label || ''} data-shadcn-native="true" ref={node => { control = node }} /></RadioGroup>); host.append(source)
  } else if (tag === 'button') {
    renderInto(host, <ButtonHost props={{ type: options.type || 'button', ...props }} refValue={node => { control = node }}>{options.text || null}</ButtonHost>)
  } else {
    renderInto(host, <InputHost props={{ type: options.type || 'text', ...props, defaultValue: value }} refValue={node => { control = node }} />)
  }

  function actual () { return control || host.querySelector('[data-shadcn-owned]') || host.querySelector('input,textarea,button') }
  for (const key of ['value', 'checked', 'disabled', 'type', 'id', 'name', 'title', 'placeholder', 'required', 'min', 'max', 'step', 'accept', 'autocomplete', 'spellcheck', 'files', 'form', 'textContent', 'innerHTML', 'className', 'classList']) {
    Object.defineProperty(host, key, {
      configurable: true,
      get () { const current = actual(); if (key === 'value') return source && tag === 'select' ? source.value : current ? current.value : value; if (key === 'checked') return tag === 'checkbox' ? checked : Boolean(source?.checked); if (key === 'files') return current?.files; if (key === 'className') return current?.className || host.className; return current?.[key] },
      set (next) {
        const current = actual();
        if (key === 'value') { value = next; if (tag === 'select' && source) { source.value = next; setSelectedValue?.(String(next)) } else if (current) current.value = next }
        else if (key === 'checked') { checked = Boolean(next); if (source) source.checked = checked; if (tag === 'checkbox') setCheckedValue?.(checked) }
        else if (key === 'className') { if (current) current.className = next }
        else if (key !== 'files' && current) current[key] = next
      }
    })
  }
  Object.defineProperty(host, 'dataset', { configurable: true, get () { return new Proxy({}, { get: (_, key) => source && ['checkbox', 'radio', 'select'].includes(tag) ? source.dataset[key] : actual()?.dataset?.[key], set: (_, key, value) => { if (actual() && !source) actual().dataset[key] = value; if (source) source.dataset[key] = value; return true } }) } })
  Object.defineProperty(host, 'setAttribute', { value: (name, val) => { actual()?.setAttribute(name, val); source?.setAttribute(name, val) } })
  Object.defineProperty(host, 'getAttribute', { value: name => actual()?.getAttribute(name) ?? source?.getAttribute(name) })
  for (const method of ['addEventListener', 'removeEventListener', 'append', 'appendChild', 'focus', 'click', 'remove', 'closest', 'querySelector', 'querySelectorAll']) {
    Object.defineProperty(host, method, { configurable: true, value: (...args) => actual()?.[method]?.(...args) })
  }
  return host
}

function createControl (tag, options = {}) {
  if (tag === 'input' && options.type === 'checkbox') tag = 'checkbox'
  if (tag === 'input' && options.type === 'radio') tag = 'radio'
  if (!['button', 'input', 'textarea', 'select', 'checkbox', 'radio'].includes(tag)) return document.createElement(tag)
  return createImperative(tag, options)
}

function createBadge (text, variant = 'secondary', className = '') {
  const host = document.createElement('span'); host.className = 'shadcn-control-host shadcn-badge-host'
  renderInto(host, <Badge variant={variant} className={className}>{text}</Badge>)
  return host
}

function mountToaster () {
  if (toasterRoot) return
  const host = document.createElement('div'); host.dataset.shadcnRoot = 'toaster'; document.body.append(host)
  toasterRoot = createRoot(host)
  toasterRoot.render(<Toaster className="shadcn-toaster" position="top-center" theme="light" richColors duration={4500} visibleToasts={3} toastOptions={{ classNames: { toast: 'shadcn-toast' } }} />)
}

function notify (message, type = 'info', options = {}) {
  mountToaster()
  const kind = type === true || type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'loading' || type === 'pending' ? 'loading' : 'info'
  return toast[kind](String(message || (kind === 'error' ? '操作未完成，请重试。' : '操作已完成。')), options)
}

function openDialog (html, trigger, onClose) { mountToaster(); return showDialog(html, trigger, onClose) }

function installObserver () {
  enhance(document)
  observer = new MutationObserver(records => {
    const removed = new Set()
    for (const record of records) {
      for (const node of record.removedNodes) if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches('[data-shadcn-host]')) removed.add(node)
        for (const host of node.querySelectorAll('[data-shadcn-host]')) removed.add(host)
      }
      for (const node of record.addedNodes) if (node.nodeType === Node.ELEMENT_NODE && !node.closest?.('[data-shadcn-root], [data-sonner-toaster], [data-sonner-toast]')) enhance(node)
    }
    for (const host of removed) if (!host.isConnected) {
      if (host.dataset.shadcnHost === 'radio') {
        const key = host.dataset.shadcnRadioKey; const group = radioGroups.get(key)
        group?.renderers.delete(radioRendererByHost.get(host))
        for (const source of host.querySelectorAll('input[type="radio"]')) group?.sources.delete(source)
        if (group && !group.sources.size) radioGroups.delete(key)
      }
      const root = roots.get(host)
      if (root) { root.unmount(); roots.delete(host) }
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

window.ShadcnUI = Object.freeze({
  enhance,
  createControl,
  createBadge,
  createAdminTabs,
  clearAdminTabs,
  notify,
  openDialog,
  closeDialog,
  confirm: options => window.WorkspaceDialogs?.confirm(options) ?? Promise.resolve(false),
  confirmDelete: options => window.WorkspaceDialogs?.confirmDelete(options) ?? Promise.resolve(false),
  isDialogOpen
})
mountToaster()
installObserver()
