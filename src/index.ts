import type { NodeAPI } from 'node-red';
import { registerSwitchBotCredentialsNode } from './nodes/switchbot-credentials';
import { registerSwitchBotDeviceStatusNode } from './nodes/switchbot-device-status';
import { registerSwitchBotDeviceCommandNode } from './nodes/switchbot-device-command';

/**
 * Node-REDから呼び出されるエントリポイント。
 * ここでカスタムノードの登録を行う。
 */
module.exports = (RED: NodeAPI): void => {
  registerSwitchBotCredentialsNode(RED);
  registerSwitchBotDeviceStatusNode(RED);
  registerSwitchBotDeviceCommandNode(RED);
};
