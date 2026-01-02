import axios, { type AxiosInstance } from 'axios';
import { createHmac, randomUUID } from 'crypto';

/**
 * SwitchBot APIの汎用レスポンス型。
 * @template TBody APIごとのbodyペイロードの型。
 */
export interface SwitchBotResponse<TBody> {
  statusCode: number;
  message: string;
  body: TBody;
}

/**
 * SwitchBotデバイス一覧の要素。
 * 公式のdeviceListスキーマを簡略化。
 */
export interface SwitchBotDeviceSummary {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  hubDeviceId: string;
  [key: string]: unknown;
}

/**
 * SwitchBotデバイス一覧APIのレスポンスbody。
 */
export interface SwitchBotDeviceListBody {
  deviceList: SwitchBotDeviceSummary[];
  infraredRemoteList?: unknown[];
}

/**
 * SwitchBotデバイスのステータスフィールド。
 * デバイスタイプにより返されるフィールドが異なる。
 * 公式レスポンスはデバイス設定により増減するため、未知フィールドも許容する。
 */
export interface MotionSensorProBody {
  // 共通フィールド
  deviceId: string;
  deviceType: string;
  hubDeviceId: string;
  version?: string;
  battery?: number;
  wifiRssi?: number;

  // Presence Sensor / Motion Sensor 系
  detected?: boolean;
  lightLevel?: number;
  moveDetected?: 'detected' | 'notDetected' | 'clear' | 'unknown';
  brightness?: 'bright' | 'dim' | number;

  // CO2センサー / 温湿度計 系
  co2?: number;
  temperature?: number;
  humidity?: number;

  // カーテン系
  calibrate?: boolean;
  group?: boolean;
  moving?: boolean;
  slidePosition?: number;

  // ロボット掃除機系
  workingStatus?: string;
  onlineStatus?: string;

  // プラグ系
  power?: string;
  voltage?: number;
  electricCurrent?: number;

  // 未知フィールドも許容
  [key: string]: unknown;
}

/**
 * SwitchBot APIクライアント。
 * HMAC署名を生成し、指定デバイスのステータス取得を提供する。
 */
export class SwitchBotClient {
  private readonly http: AxiosInstance;

  /**
   * @param token SwitchBotアプリで取得したトークン
   * @param secret SwitchBotアプリで取得したシークレット
   * @param baseUrl APIのベースURL（デフォルト: v1.1）
   */
  constructor(
    private readonly token: string,
    private readonly secret: string,
    baseUrl = 'https://api.switch-bot.com/v1.1',
  ) {
    // axiosインスタンスを生成しておき、毎回の指定を簡略化する。
    // タイムアウトを設定してハングを避ける（5秒）。
    this.http = axios.create({ baseURL: baseUrl, timeout: 5000 });
  }

  /**
   * Motion Sensor Proのステータスを取得する。
   * @param deviceId 対象デバイスのID
   */
  async getMotionSensorProStatus(
    deviceId: string,
  ): Promise<SwitchBotResponse<MotionSensorProBody>> {
    // 署名付きヘッダーを生成する。
    const headers = this.createSignedHeaders();

    // ステータス取得エンドポイントへGETリクエストを送る。
    const response = await this.http.get<SwitchBotResponse<MotionSensorProBody>>(
      `/devices/${deviceId}/status`,
      { headers },
    );

    // axiosのdata部のみ返すことで呼び出し側の扱いを簡素化する。
    return response.data;
  }

  /**
   * デバイス一覧を取得する。
   * ノード設定UIでデバイス選択に利用する。
   */
  async getDevices(): Promise<SwitchBotResponse<SwitchBotDeviceListBody>> {
    const headers = this.createSignedHeaders();
    const response = await this.http.get<SwitchBotResponse<SwitchBotDeviceListBody>>(
      '/devices',
      { headers },
    );
    return response.data;
  }

  /**
   * デバイスにコマンドを送信する。
   * エアコンON/OFF、プラグ制御、カーテン操作など汎用的に使用可能。
   * @param deviceId 対象デバイスのID
   * @param command コマンド名（例: turnOn, turnOff, setAll）
   * @param parameter コマンドパラメータ（例: default, "26,2,1,on"）
   * @param commandType コマンドタイプ（command または customize）
   */
  async sendCommand(
    deviceId: string,
    command: string,
    parameter: string = 'default',
    commandType: 'command' | 'customize' = 'command',
  ): Promise<SwitchBotResponse<Record<string, unknown>>> {
    const headers = this.createSignedHeaders();

    // コマンド送信用のリクエストボディを構築する。
    const body = {
      command,
      parameter,
      commandType,
    };

    // デバイスのコマンドエンドポイントへPOSTリクエストを送る。
    const response = await this.http.post<SwitchBotResponse<Record<string, unknown>>>(
      `/devices/${deviceId}/commands`,
      body,
      { headers },
    );

    return response.data;
  }

  /**
   * SwitchBot API用の署名付きヘッダーを生成する。
   */
  private createSignedHeaders(): Record<string, string> {
    // タイムスタンプと乱数（nonce）を用意する。
    const timestamp = Date.now().toString();
    const nonce = randomUUID();

    // トークン + タイムスタンプ + ノンスをHMAC-SHA256で署名し、Base64化する。
    const sign = createHmac('sha256', this.secret)
      .update(`${this.token}${timestamp}${nonce}`)
      .digest('base64');

    // SwitchBot API指定のヘッダー形式を返す。
    return {
      Authorization: this.token,
      sign,
      nonce,
      t: timestamp,
      'Content-Type': 'application/json',
    };
  }
}

