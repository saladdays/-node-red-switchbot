"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const switchbotClient_1 = require("./switchbotClient");
// .envを読み込んで環境変数を参照可能にする。
(0, dotenv_1.config)();
/**
 * 必須環境変数が揃っているかを確認する。
 * @returns 検証後のトークン・シークレット・デバイスID
 */
function loadEnv() {
    // それぞれの環境変数を取得する。
    const token = process.env.SWITCHBOT_TOKEN;
    const secret = process.env.SWITCHBOT_SECRET;
    const deviceId = process.env.SWITCHBOT_DEVICE_ID;
    // 足りないものがあれば明示的に終了する。
    if (!token || !secret || !deviceId) {
        console.error('SWITCHBOT_TOKEN, SWITCHBOT_SECRET, SWITCHBOT_DEVICE_ID を設定してください (.env 推奨)');
        process.exit(1);
    }
    // ここまで来たら3つとも存在するので型を絞り込んで返す。
    return { token, secret, deviceId };
}
/**
 * Motion Sensor Proのステータスを取得し、整形して表示するメイン処理。
 */
async function main() {
    // 環境変数を読み込む。
    const { token, secret, deviceId } = loadEnv();
    // SwitchBotクライアントを生成する。
    const client = new switchbotClient_1.SwitchBotClient(token, secret);
    // APIへリクエストし、レスポンスを受け取る。
    const response = await client.getMotionSensorProStatus(deviceId);
    // 成功ステータス（100）以外の場合はエラーとして通知する。
    if (response.statusCode !== 100) {
        console.error(`API error: statusCode=${response.statusCode}, message=${response.message}`);
        process.exit(1);
    }
    // 実際のセンサーデータを取り出す。
    const body = response.body;
    // lightLevelを人間向けにラベル化する。
    const brightnessLabel = mapLightLevelToLabel(body.lightLevel);
    // 主要フィールドを分かりやすく表示する。
    console.log('--- Motion Sensor Pro Status ---');
    console.log(`deviceId     : ${body.deviceId}`);
    console.log(`deviceType   : ${body.deviceType}`);
    console.log(`hubDeviceId  : ${body.hubDeviceId}`);
    console.log(`detected     : ${body.detected ?? 'unknown'}`);
    console.log(`lightLevel   : ${body.lightLevel ?? 'unknown'}`);
    console.log(`brightnessLbl: ${brightnessLabel}`);
    console.log(`co2          : ${body.co2 ?? 'unknown'}`);
    console.log(`temperature  : ${body.temperature ?? 'unknown'}`);
    console.log(`humidity     : ${body.humidity ?? 'unknown'}`);
    console.log(`moveDetected : ${body.moveDetected ?? 'unknown'}`);
    console.log(`brightness   : ${body.brightness ?? 'unknown'}`);
    console.log(`wifiRssi     : ${body.wifiRssi ?? 'unknown'}`);
    console.log(`battery      : ${body.battery ?? 'unknown'}`);
    console.log(`version      : ${body.version ?? 'unknown'}`);
    // 完全なレスポンスをJSONで表示し、デバッグ可能にする。
    console.log('\nFull payload:');
    console.log(JSON.stringify(response, null, 2));
}
// エントリポイント。
main().catch((error) => {
    // 例外が起きた場合もメッセージを表示して終了する。
    console.error('Unexpected error:', error);
    process.exit(1);
});
/**
 * lightLevelを人間向けのラベルに変換する。
 * SwitchBot公式仕様に依存するため、数値の意味はデバイス仕様に合わせて調整する。
 */
function mapLightLevelToLabel(level) {
    if (level === undefined || level === null)
        return 'unknown';
    if (level >= 2)
        return 'bright';
    if (level === 1)
        return 'dim';
    if (level <= 0)
        return 'dark';
    return 'unknown';
}
