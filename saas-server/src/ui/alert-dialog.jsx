import * as Primitive from '@radix-ui/react-alert-dialog'

// 按 shadcn/ui 的 Alert Dialog 组合契约封装真实 Radix 组件；现有页面通过统一适配层使用。
export const AlertDialog = Primitive.Root
export const AlertDialogTitle = Primitive.Title
export const AlertDialogDescription = Primitive.Description
export function AlertDialogContent ({ children, ...props }) {
  return <Primitive.Portal>
    <Primitive.Overlay data-slot="alert-dialog-overlay" className="shadcn-alert-overlay" />
    <Primitive.Content data-slot="alert-dialog-content" className="shadcn-alert-content" {...props}>{children}</Primitive.Content>
  </Primitive.Portal>
}
export function AlertDialogHeader ({ children }) { return <div data-slot="alert-dialog-header" className="shadcn-alert-header">{children}</div> }
export function AlertDialogFooter ({ children }) { return <div data-slot="alert-dialog-footer" className="shadcn-alert-footer">{children}</div> }
export function AlertDialogCancel (props) { return <Primitive.Cancel className="shadcn-dialog-button shadcn-dialog-cancel" {...props} /> }
export function AlertDialogAction ({ destructive = true, ...props }) { return <Primitive.Action className={`shadcn-dialog-button ${destructive ? 'shadcn-dialog-destructive' : 'shadcn-dialog-primary'}`} {...props} /> }
