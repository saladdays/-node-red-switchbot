import type { Node, NodeAPI, NodeDef } from 'node-red';

/**
 * SwitchBot認証情報を保持するConfig Node。
 * 複数のSwitchBotノードで共有して使用する。
 */
export interface SwitchBotCredentialsConfig extends NodeDef {
  name: string;
}

/**
 * 実際の認証情報（credentials）はNode-REDが暗号化して管理する。
 */
export interface SwitchBotCredentials {
  token: string;
  secret: string;
}

/**
 * Config Nodeのインスタンス型。
 * 他のノードから参照してToken/Secretを取得する。
 */
export interface SwitchBotCredentialsNode extends Node {
  credentials: SwitchBotCredentials;
}

/**
 * SwitchBot認証情報Config Nodeを登録する。
 */
export function registerSwitchBotCredentialsNode(RED: NodeAPI): void {
  function SwitchBotCredentialsNodeConstructor(
    this: SwitchBotCredentialsNode,
    config: SwitchBotCredentialsConfig,
  ): void {
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

module.exports = (RED: NodeAPI): void => {
  registerSwitchBotCredentialsNode(RED);
};



