"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const switchbot_credentials_1 = require("./nodes/switchbot-credentials");
const switchbot_device_status_1 = require("./nodes/switchbot-device-status");
const switchbot_device_command_1 = require("./nodes/switchbot-device-command");
/**
 * Node-REDから呼び出されるエントリポイント。
 * ここでカスタムノードの登録を行う。
 */
module.exports = (RED) => {
    (0, switchbot_credentials_1.registerSwitchBotCredentialsNode)(RED);
    (0, switchbot_device_status_1.registerSwitchBotDeviceStatusNode)(RED);
    (0, switchbot_device_command_1.registerSwitchBotDeviceCommandNode)(RED);
};
