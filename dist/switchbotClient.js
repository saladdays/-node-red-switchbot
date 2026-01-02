"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchBotClient = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
/**
 * SwitchBot APIクライアント。
 * HMAC署名を生成し、指定デバイスのステータス取得を提供する。
 */
class SwitchBotClient {
    /**
     * @param token SwitchBotアプリで取得したトークン
     * @param secret SwitchBotアプリで取得したシークレット
     * @param baseUrl APIのベースURL（デフォルト: v1.1）
     */
    constructor(token, secret, baseUrl = 'https://api.switch-bot.com/v1.1') {
        this.token = token;
        this.secret = secret;
        // axiosインスタンスを生成しておき、毎回の指定を簡略化する。
        // タイムアウトを設定してハングを避ける（5秒）。
        this.http = axios_1.default.create({ baseURL: baseUrl, timeout: 5000 });
    }
    /**
     * Motion Sensor Proのステータスを取得する。
     * @param deviceId 対象デバイスのID
     */
    async getMotionSensorProStatus(deviceId) {
        // 署名付きヘッダーを生成する。
        const headers = this.createSignedHeaders();
        // ステータス取得エンドポイントへGETリクエストを送る。
        const response = await this.http.get(`/devices/${deviceId}/status`, { headers });
        // axiosのdata部のみ返すことで呼び出し側の扱いを簡素化する。
        return response.data;
    }
    /**
     * デバイス一覧を取得する。
     * ノード設定UIでデバイス選択に利用する。
     */
    async getDevices() {
        const headers = this.createSignedHeaders();
        const response = await this.http.get('/devices', { headers });
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
    async sendCommand(deviceId, command, parameter = 'default', commandType = 'command') {
        const headers = this.createSignedHeaders();
        // コマンド送信用のリクエストボディを構築する。
        const body = {
            command,
            parameter,
            commandType,
        };
        // デバイスのコマンドエンドポイントへPOSTリクエストを送る。
        const response = await this.http.post(`/devices/${deviceId}/commands`, body, { headers });
        return response.data;
    }
    /**
     * SwitchBot API用の署名付きヘッダーを生成する。
     */
    createSignedHeaders() {
        // タイムスタンプと乱数（nonce）を用意する。
        const timestamp = Date.now().toString();
        const nonce = (0, crypto_1.randomUUID)();
        // トークン + タイムスタンプ + ノンスをHMAC-SHA256で署名し、Base64化する。
        const sign = (0, crypto_1.createHmac)('sha256', this.secret)
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
exports.SwitchBotClient = SwitchBotClient;
