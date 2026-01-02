/**
 * SwitchBot Device Command Node
 * デバイスにコマンドを送信するNode-REDノード。
 * エアコン、プラグ、Bot、カーテンなど各種デバイスの制御に対応。
 */

import type { NodeAPI, Node, NodeDef, NodeMessageInFlow } from 'node-red';
import { SwitchBotClient } from '../switchbotClient';

/**
 * Config Nodeの型定義（switchbot-credentials）。
 * credentialsプロパティ内にtoken/secretが格納される。
 */
interface SwitchBotCredentialsNode extends Node {
  credentials: {
    token: string;
    secret: string;
  };
}

/**
 * ノードの設定用型。
 */
export interface SwitchBotDeviceCommandConfig extends NodeDef {
  name: string;
  account: string; // Config NodeのID
  deviceId?: string;
  deviceType?: string; // デバイスタイプ（コマンド選択用）
  command?: string;
  customCommand?: string; // カスタムコマンド名
  parameter?: string;
  commandType?: 'command' | 'customize';
}

/**
 * 入力メッセージのpayload型。
 * msg.payloadでコマンドを動的に指定可能。
 */
interface CommandPayload {
  deviceId?: string;
  command?: string;
  parameter?: string;
  commandType?: 'command' | 'customize';
}

/**
 * ノードを登録するメイン関数。
 */
export function registerSwitchBotDeviceCommandNode(RED: NodeAPI): void {
  /**
   * ノード本体の実装。
   */
  function SwitchBotDeviceCommandNode(
    this: Node,
    config: SwitchBotDeviceCommandConfig,
  ): void {
    // Node-REDにノードを登録する。
    RED.nodes.createNode(this, config);

    // Config Nodeへの参照を取得
    const credentialsNode = RED.nodes.getNode(config.account) as SwitchBotCredentialsNode | null;

    // メッセージ受信時のハンドラ
    this.on('input', async (msg: NodeMessageInFlow, send, done) => {
      try {
        // 認証情報を解決する
        const credentials = resolveCredentials(credentialsNode, config);
        if (!credentials.token || !credentials.secret) {
          this.error('Token/Secret not configured');
          this.status({ fill: 'red', shape: 'ring', text: 'auth error' });
          done();
          return;
        }

        // msg.payloadからの動的パラメータを取得
        const payload = (msg.payload as CommandPayload) || {};

        // デバイスID（msg.payload優先、なければ設定値）
        const deviceId = payload.deviceId || config.deviceId;
        if (!deviceId) {
          this.error('Device ID not specified');
          this.status({ fill: 'red', shape: 'ring', text: 'no device' });
          done();
          return;
        }

        // コマンド（msg.payload優先、なければ設定値）
        const command = payload.command || config.command;
        if (!command) {
          this.error('Command not specified');
          this.status({ fill: 'red', shape: 'ring', text: 'no command' });
          done();
          return;
        }

        // パラメータ（msg.payload優先、なければ設定値、デフォルトは'default'）
        const parameter = payload.parameter || config.parameter || 'default';

        // コマンドタイプ（msg.payload優先、なければ設定値、デフォルトは'command'）
        const commandType = payload.commandType || config.commandType || 'command';

        // 処理中ステータスを表示
        this.status({ fill: 'blue', shape: 'dot', text: 'sending...' });

        // SwitchBot APIクライアントを生成してコマンド送信
        const client = new SwitchBotClient(credentials.token, credentials.secret);
        const result = await client.sendCommand(deviceId, command, parameter, commandType);

        // 成功時のペイロードを構築
        const outputPayload = {
          success: result.statusCode === 100,
          statusCode: result.statusCode,
          message: result.message,
          body: result.body,
          request: {
            deviceId,
            command,
            parameter,
            commandType,
          },
        };

        // 成功/失敗に応じたステータス表示
        if (result.statusCode === 100) {
          this.status({ fill: 'green', shape: 'dot', text: `ok: ${command}` });
        } else {
          this.status({ fill: 'yellow', shape: 'ring', text: `${result.message}` });
        }

        // 次のノードへメッセージを送信
        send({ ...msg, payload: outputPayload });
        done();
      } catch (error) {
        // エラーハンドリング
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.error(`Command error: ${errorMessage}`);
        this.status({ fill: 'red', shape: 'ring', text: 'error' });
        done(error instanceof Error ? error : new Error(errorMessage));
      }
    });
  }

  // ノードタイプを登録
  RED.nodes.registerType('switchbot-device-command', SwitchBotDeviceCommandNode);

  /**
   * デバイス一覧取得用のHTTPエンドポイント。
   * UI側からAjaxで呼び出される。
   */
  RED.httpAdmin.post('/switchbot-device-command/devices', async (req, res) => {
    try {
      let token: string | undefined;
      let secret: string | undefined;

      // Config Nodeから認証情報を取得
      if (req.body && req.body.accountId) {
        const configNode = RED.nodes.getNode(req.body.accountId) as SwitchBotCredentialsNode | null;
        if (configNode && configNode.credentials) {
          token = configNode.credentials.token || '';
          secret = configNode.credentials.secret || '';
        }
      }

      // Config Nodeがない場合は環境変数から取得
      if (!token) {
        token = process.env.SWITCHBOT_TOKEN || '';
      }
      if (!secret) {
        secret = process.env.SWITCHBOT_SECRET || '';
      }

      // 認証情報がない場合はエラー
      if (!token || !secret) {
        res.status(400).json({ error: 'Token/Secret not configured. Please deploy config node first.' });
        return;
      }

      // デバイス一覧を取得
      const client = new SwitchBotClient(token, secret);
      const result = await client.getDevices();

      // 物理デバイスと赤外線リモコンデバイスを統合して返す
      const devices = [
        ...(result.body.deviceList || []).map((d) => ({
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          deviceType: d.deviceType,
          isInfrared: false,
        })),
        ...(result.body.infraredRemoteList || []).map((ir: unknown) => {
          const irDevice = ir as Record<string, unknown>;
          return {
            deviceId: irDevice.deviceId as string,
            deviceName: irDevice.deviceName as string,
            deviceType: irDevice.deviceType as string,
            remoteType: irDevice.remoteType as string, // IR固有のタイプ（Air Conditioner等）
            isInfrared: true,
          };
        }),
      ];

      res.json({ devices });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  });
}

/**
 * 認証情報を解決する。
 * Config Node → 環境変数の優先順位で取得。
 */
function resolveCredentials(
  credentialsNode: SwitchBotCredentialsNode | null,
  _config: SwitchBotDeviceCommandConfig,
): { token?: string; secret?: string } {
  // Config Nodeから取得（credentialsプロパティ内）
  if (credentialsNode?.credentials?.token && credentialsNode?.credentials?.secret) {
    return {
      token: credentialsNode.credentials.token,
      secret: credentialsNode.credentials.secret,
    };
  }

  // 環境変数からフォールバック
  return {
    token: process.env.SWITCHBOT_TOKEN,
    secret: process.env.SWITCHBOT_SECRET,
  };
}

// Node-REDからのエクスポート
module.exports = (RED: NodeAPI): void => registerSwitchBotDeviceCommandNode(RED);

