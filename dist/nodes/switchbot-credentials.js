"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSwitchBotCredentialsNode = registerSwitchBotCredentialsNode;
/**
 * SwitchBot認証情報Config Nodeを登録する。
 */
function registerSwitchBotCredentialsNode(RED) {
    function SwitchBotCredentialsNodeConstructor(config) {
        RED.nodes.createNode(this, config);
        // credentialsはNode-REDが自動で this.credentials に注入する
    }
    // Node-REDへConfig Nodeとして登録
    RED.nodes.registerType('switchbot-credentials', SwitchBotCredentialsNodeConstructor, {
        credentials: {
            token: { type: 'text' },
            secret: { type: 'password' },
        },
    });
}
module.exports = (RED) => {
    registerSwitchBotCredentialsNode(RED);
};
