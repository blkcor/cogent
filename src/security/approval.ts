import { ApprovalMode } from '../config'
import type { Tool } from '../tool'

export interface IApprovalSystem {
  needsApproval(tool: Tool<any>, params: Record<string, any>): boolean
  requestApproval(tool: Tool<any>, params: Record<string, any>): Promise<boolean>
}

export class ApprovalSystem implements IApprovalSystem {
  private mode: ApprovalMode

  constructor(mode: ApprovalMode = ApprovalMode.DEFAULT) {
    this.mode = mode
  }

  needsApproval(tool: Tool<any>, params: Record<string, any>): boolean {
    switch (this.mode) {
      case ApprovalMode.YOLO:
        return false

      case ApprovalMode.AUTO_EDIT:
        return tool.approval?.category !== 'read'

      case ApprovalMode.STRICT:
        return tool.approval?.category !== 'read'

      case ApprovalMode.DEFAULT:
      default:
        if (tool.approval?.category === 'read') {
          return false
        }

        if (tool.approval?.needsApproval) {
          return tool.approval.needsApproval({
            toolName: tool.name,
            params,
            approvalMode: this.mode,
            context: {},
          }) as boolean
        }

        return tool.approval?.category === 'write' || tool.approval?.category === 'command'
    }
  }

  async requestApproval(tool: Tool<any>, params: Record<string, any>): Promise<boolean> {
    console.log(`Requesting approval for ${tool.name} with params:`, params)

    if (this.mode === ApprovalMode.YOLO) {
      return true
    }

    return true
  }

  setMode(mode: ApprovalMode): void {
    this.mode = mode
  }

  getMode(): ApprovalMode {
    return this.mode
  }
}
