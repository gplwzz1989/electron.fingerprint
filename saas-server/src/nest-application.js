require('reflect-metadata')

const { All, Controller, Inject, Module, Req, Res } = require('@nestjs/common')
const { NestFactory } = require('@nestjs/core')

const WORKSPACE_REQUEST_SERVICE = Symbol('WORKSPACE_REQUEST_SERVICE')

function controllerFor (name, routes) {
  class DomainController {
    constructor (workspace) { this.workspace = workspace }
    async forward (request, response) {
      try { await this.workspace.handle(request, response) } catch (error) {
        console.error('[Nest request failed]', error?.code || error?.name || 'UnknownError')
        if (response.headersSent) { response.destroy(); return }
        response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
        response.end(JSON.stringify({ ok: false, message: '服务暂时不可用，请稍后重试。' }))
      }
    }
  }
  Object.defineProperty(DomainController, 'name', { value: name })
  Controller()(DomainController)
  Inject(WORKSPACE_REQUEST_SERVICE)(DomainController, undefined, 0)
  for (const [index, route] of routes.entries()) {
    const methodName = `route${index}`
    Object.defineProperty(DomainController.prototype, methodName, {
      configurable: true,
      value: function (request, response) { return this.forward(request, response) }
    })
    const descriptor = Object.getOwnPropertyDescriptor(DomainController.prototype, methodName)
    All(route)(DomainController.prototype, methodName, descriptor)
    Req()(DomainController.prototype, methodName, 0)
    Res()(DomainController.prototype, methodName, 1)
  }
  return DomainController
}

function featureModule (name, routes, coreModule) {
  const routeController = controllerFor(`${name}Controller`, routes)
  class FeatureModule {}
  Object.defineProperty(FeatureModule, 'name', { value: `${name}Module` })
  Module({ imports: [coreModule], controllers: [routeController] })(FeatureModule)
  return FeatureModule
}

async function createNestApplication (workspace) {
  class WorkspaceCoreModule {}
  Module({
    providers: [{ provide: WORKSPACE_REQUEST_SERVICE, useValue: workspace }],
    exports: [WORKSPACE_REQUEST_SERVICE]
  })(WorkspaceCoreModule)

  const modules = [
    featureModule('Authentication', ['api/auth/*'], WorkspaceCoreModule),
    featureModule('Platform', ['api/platforms', 'api/platform-runtime', 'api/platform-releases/*', 'platform-runtime/*'], WorkspaceCoreModule),
    featureModule('SystemConfiguration', ['api/system/*'], WorkspaceCoreModule),
    featureModule('Payments', ['api/payments/*'], WorkspaceCoreModule),
    featureModule('Workspace', ['api/workspaces/*'], WorkspaceCoreModule),
    featureModule('Gateway', ['*', '/'], WorkspaceCoreModule)
  ]
  class SaaSApplicationModule {}
  Module({ imports: [WorkspaceCoreModule, ...modules] })(SaaSApplicationModule)

  const app = await NestFactory.create(SaaSApplicationModule, { bodyParser: false, logger: false })
  app.getHttpAdapter().getInstance().disable('x-powered-by')
  workspace.app = app
  workspace.server = app.getHttpServer()
  try {
    await app.listen(workspace.port, workspace.host)
    return app
  } catch (error) {
    await app.close()
    workspace.app = null
    workspace.server = null
    throw error
  }
}

module.exports = { createNestApplication }
