import { useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './alert-dialog'

let active = null
function DeleteDialog ({ title, name, description, actionLabel, destructive, finish, trigger }) {
  const cancel = useRef(null)
  return <AlertDialog open onOpenChange={open => { if (!open) finish(false) }}>
    <AlertDialogContent
      onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus() }}
      onCloseAutoFocus={event => { event.preventDefault(); setTimeout(() => (trigger?.isConnected && !trigger.disabled ? trigger : document.getElementById('page'))?.focus(), 0) }}>
      <div className={`shadcn-alert-icon${destructive ? '' : ' shadcn-alert-icon-primary'}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={destructive ? 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7' : 'M12 3 4 6v5c0 5 8 10 8 10s8-5 8-10V6l-8-3ZM8 12l3 3 5-6'} /></svg></div>
      <AlertDialogHeader>
        <AlertDialogTitle className="shadcn-alert-title">{title}</AlertDialogTitle>
        <AlertDialogDescription className="shadcn-alert-description">{name ? <><strong>{name}</strong><br /></> : null}{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel ref={cancel} onClick={() => finish(false)}>取消</AlertDialogCancel><AlertDialogAction destructive={destructive} onClick={() => finish(true)}>{actionLabel}</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}

function confirmAction ({ title = '请确认操作', name = '', description = '', actionLabel = '确定', destructive = false, trigger: triggerElement } = {}) {
  if (active) return Promise.resolve(false)
  const trigger = triggerElement || document.activeElement
  const host = document.createElement('div'); host.dataset.shadcnRoot = 'delete-dialog'; document.body.append(host)
  // 跟随当前内容区居中，避免弹层覆盖常驻导航；窄屏则在视口内居中。
  const left = Math.max(0, Math.min(document.getElementById('page')?.getBoundingClientRect().left || 0, innerWidth / 2))
  document.documentElement.style.setProperty('--shadcn-dialog-content-left', innerWidth >= 640 ? left + 'px' : '0px')
  const root = createRoot(host)
  return new Promise(resolve => {
    const finish = result => {
      if (active !== finish) return
      active = null; root.render(null); resolve(result)
      setTimeout(() => { root.unmount(); host.remove() }, 150)
    }
    active = finish
    root.render(<DeleteDialog title={title} name={name} description={description} actionLabel={actionLabel} destructive={destructive} finish={finish} trigger={trigger} />)
  })
}
window.WorkspaceDialogs = Object.freeze({ confirm: confirmAction, confirmDelete: options => confirmAction({ title: '确认删除？', description: '删除后将从当前列表中移除，历史数据仍会保留。', actionLabel: '确认删除', ...options, destructive: true }) })
