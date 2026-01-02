"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSwitchBotDeviceStatusNode = registerSwitchBotDeviceStatusNode;
const switchbotClient_1 = require("../switchbotClient");
/**
 * lightLevelを人間向けのラベルに変換する。
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
/**
 * デバイスステータスを正規化する。
 * APIレスポンスに実際に含まれているフィールドのみ出力。
 */
function normalizePayload(body) {
    const result = {
        deviceId: body.deviceId,
        deviceType: body.deviceType,
        hubDeviceId: body.hubDeviceId,
    };
    // オプショナルフィールド: APIレスポンスに存在する場合のみ追加
    if (body.detected !== undefined) {
        result.detected = body.detected;
    }
    if (body.lightLevel !== undefined) {
        result.lightLevel = body.lightLevel;
        result.brightnessLabel = mapLightLevelToLabel(body.lightLevel);
    }
    if (body.moveDetected !== undefined) {
        result.moveDetected = body.moveDetected;
    }
    if (body.brightness !== undefined) {
        result.brightness = body.brightness;
    }
    if (body.co2 !== undefined) {
        result.co2 = body.co2;
    }
    if (body.temperature !== undefined) {
        result.temperature = body.temperature;
    }
    if (body.humidity !== undefined) {
        result.humidity = body.humidity;
    }
    if (body.wifiRssi !== undefined) {
        result.wifiRssi = body.wifiRssi;
    }
    if (body.battery !== undefined) {
        result.battery = body.battery;
    }
    if (body.version !== undefined) {
        result.version = body.version;
    }
    // カーテン系
    if (body.calibrate !== undefined) {
        result.calibrate = body.calibrate;
    }
    if (body.group !== undefined) {
        result.group = body.group;
    }
    if (body.moving !== undefined) {
        result.moving = body.moving;
    }
    if (body.slidePosition !== undefined) {
        result.slidePosition = body.slidePosition;
    }
    // ロボット掃除機系
    if (body.workingStatus !== undefined) {
        result.workingStatus = body.workingStatus;
    }
    if (body.onlineStatus !== undefined) {
        result.onlineStatus = body.onlineStatus;
    }
    // プラグ系
    if (body.power !== undefined) {
        result.power = body.power;
    }
    if (body.voltage !== undefined) {
        result.voltage = body.voltage;
    }
    if (body.electricCurrent !== undefined) {
        result.electricCurrent = body.electricCurrent;
    }
    // 元レスポンス
    result.raw = body;
    return result;
}
/**
 * SwitchBot Device Statusノードを登録する。
 */
function registerSwitchBotDeviceStatusNode(RED) {
    // デバイス一覧取得エンドポイント
    RED.httpAdmin.post('/switchbot-device-status/devices', async (req, res) => {
        try {
            // Config Node IDからToken/Secretを取得、またはリクエストボディから直接取得
            let token = '';
            let secret = '';
            if (req.body && req.body.accountId) {
                // Config Nodeから取得
                const configNode = RED.nodes.getNode(req.body.accountId);
                if (configNode && configNode.credentials) {
                    token = configNode.credentials.token || '';
                    secret = configNode.credentials.secret || '';
                }
            }
            // Config Nodeがない場合はリクエストボディから直接取得（新規設定時）
            if (!token) {
                token = (req.body && req.body.token) || process.env.SWITCHBOT_TOKEN || '';
            }
            if (!secret) {
                secret = (req.body && req.body.secret) || process.env.SWITCHBOT_SECRET || '';
            }
            if (!token || !secret) {
                res.status(400).json({
                    ok: false,
                    message: 'Please add and deploy SwitchBot credentials first',
                });
                return;
            }
            const client = new switchbotClient_1.SwitchBotClient(token, secret);
            const response = await client.getDevices();
            if (response.statusCode !== 100) {
                res.status(502).json({ ok: false, message: `API error: ${response.statusCode} ${response.message}` });
                return;
            }
            const body = response.body;
            const devices = (body.deviceList || []).map((d) => ({
                deviceId: d.deviceId,
                deviceName: d.deviceName,
                deviceType: d.deviceType,
            }));
            res.json({ ok: true, devices });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            RED.log.error(`[switchbot-device-status] devices handler error: ${message}`);
            res.status(500).json({ ok: false, message });
        }
    });
    function SwitchBotDeviceStatusNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const deviceId = config.deviceId || process.env.SWITCHBOT_DEVICE_ID || '';
        // Config Nodeへの参照を取得
        const credentialsNode = RED.nodes.getNode(config.account);
        node.status({ fill: 'grey', shape: 'ring', text: 'ready' });
        node.on('input', async (msg, send, done) => {
            const sender = send || node.send.bind(node);
            const finisher = done || (() => { });
            try {
                // Token/SecretをConfig Nodeまたは環境変数から取得
                let token = '';
                let secret = '';
                if (credentialsNode && credentialsNode.credentials) {
                    token = credentialsNode.credentials.token || '';
                    secret = credentialsNode.credentials.secret || '';
                }
                // フォールバック: 環境変数
                if (!token)
                    token = process.env.SWITCHBOT_TOKEN || '';
                if (!secret)
                    secret = process.env.SWITCHBOT_SECRET || '';
                if (!token || !secret || !deviceId) {
                    throw new Error('Token/Secret/DeviceID not configured');
                }
                node.status({ fill: 'blue', shape: 'dot', text: 'requesting...' });
                const client = new switchbotClient_1.SwitchBotClient(token, secret);
                const response = await client.getMotionSensorProStatus(deviceId);
                if (response.statusCode !== 100) {
                    node.status({ fill: 'red', shape: 'ring', text: `api error: ${response.statusCode}` });
                    node.error(`SwitchBot API error: statusCode=${response.statusCode}, message=${response.message}`, msg);
                    finisher();
                    return;
                }
                const body = response.body;
                const payload = normalizePayload(body);
                sender({ ...msg, payload });
                const statusParts = [
                    `det:${payload.detected ?? 'n/a'}`,
                    `light:${payload.brightnessLabel ?? 'n/a'}`,
                    payload.co2 !== null && payload.co2 !== undefined ? `co2:${payload.co2}` : null,
                ].filter(Boolean);
                const statusText = statusParts.join(', ');
                node.status({ fill: 'green', shape: 'dot', text: statusText });
                finisher();
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                node.status({ fill: 'red', shape: 'ring', text: 'error' });
                node.error(message, msg);
                finisher();
            }
        });
    }
    RED.nodes.registerType('switchbot-device-status', SwitchBotDeviceStatusNode);
}
module.exports = (RED) => {
    registerSwitchBotDeviceStatusNode(RED);
};
