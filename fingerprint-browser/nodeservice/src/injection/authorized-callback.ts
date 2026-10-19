import { AuthorizeStateManager } from '@/injection/state/authorize-state-manager';
import { TabAbortControllerManager } from '@/injection/state/tab-abort-controller-manager';
import type { BrowserContextIdentifier } from './type';

interface Config {
  authorizedCallback: (
    view: Electron.CrossProcessExports.WebContentsView,
    contextIdentifier: BrowserContextIdentifier,
    color: string,
    platformName: string,
    fromAccountId: string | null,
  ) => Promise<void>;
  authorizeFailedCallback: (
    view: Electron.CrossProcessExports.WebContentsView,
    contextIdentifier: BrowserContextIdentifier,
    color: string,
    platformName: string,
    fromAccountId: string | null,
  ) => Promise<void>;
  externalIsAuthorizedCallback: (
    view: Electron.CrossProcessExports.WebContentsView,
    contextIdentifier: BrowserContextIdentifier,
    color: string,
    platformName: string,
    fromAccountId: string | null,
  ) => boolean | Promise<boolean>;
  authorizeStateManager: AuthorizeStateManager;
  tabAbortControllerManager: TabAbortControllerManager;
}

const config: Config = {
  authorizedCallback: async () => {
    console.error('请先初始化授权配置authorizedCallback');
  },
  authorizeFailedCallback: async () => {
    console.error('请先初始化授权配置authorizeFailedCallback');
  },
  externalIsAuthorizedCallback: async () => {
    console.error('请先初始化授权配置externalIsAuthorizedCallback');
    return true;
  },
  authorizeStateManager: undefined as unknown as AuthorizeStateManager,
  tabAbortControllerManager: undefined as unknown as TabAbortControllerManager,
};

export { config };
