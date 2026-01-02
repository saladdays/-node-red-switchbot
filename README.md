# node-red-switchbot

[![npm version](https://badge.fury.io/js/node-red-switchbot.svg)](https://www.npmjs.com/package/node-red-switchbot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

SwitchBot device control and status nodes for Node-RED.

## Features

- 📊 **SB Status** - Get device status (temperature, humidity, CO2, motion detection, etc.)
- 🎮 **SB Command** - Send commands to devices (turn on/off, set temperature, etc.)
- 🔐 **Shared Credentials** - Configure API credentials once, use across all nodes
- 📋 **Device Picker** - Select devices from a dropdown list (no manual ID entry needed)
- 🔄 **Dynamic Commands** - Command options change based on selected device type

## Supported Devices

### Status (SB Status node)
| Device Type | Available Data |
|-------------|----------------|
| Presence Sensor / Motion Sensor | Motion detection, light level |
| Meter / Meter Plus / Outdoor Meter | Temperature, humidity, battery |
| CO2 Sensor (Hub 2) | CO2, temperature, humidity |
| Curtain / Curtain 3 | Position, calibration status |
| Robot Vacuum | Working status, online status |
| Plug / Plug Mini | Power, voltage, current |

### Commands (SB Command node)
| Device Type | Available Commands |
|-------------|-------------------|
| Bot | turnOn, turnOff, press |
| Curtain / Curtain 3 | setPosition, turnOn, turnOff |
| Plug / Plug Mini | turnOn, turnOff, toggle |
| Color Bulb | turnOn, turnOff, setBrightness, setColor |
| Strip Light | turnOn, turnOff, setBrightness, setColor |
| Air Conditioner (IR) | setAll (temperature, mode, fan speed, power) |
| Humidifier | turnOn, turnOff, setMode |
| Lock / Lock Pro | lock, unlock |
| Blind Tilt | setPosition, fullyOpen, closeUp, closeDown |
| And more... | See [SwitchBot API documentation](https://github.com/OpenWonderLabs/SwitchBotAPI) |

## Installation

### Via Node-RED Palette Manager (Recommended)

1. Open Node-RED
2. Go to **Menu → Manage palette → Install**
3. Search for `node-red-switchbot`
4. Click **Install**

### Via npm

```bash
cd ~/.node-red
npm install node-red-switchbot
```

Then restart Node-RED.

## Setup

### 1. Get SwitchBot API Credentials

1. Open SwitchBot app on your phone
2. Go to **Profile → Preferences**
3. Tap **App Version** 10 times to enable Developer Options
4. Go to **Developer Options**
5. Copy your **Token** and **Secret Key**

### 2. Configure Credentials in Node-RED

1. Drag any SwitchBot node to your flow
2. Double-click to open settings
3. Click the pencil icon next to "認証" (Authentication)
4. Enter your Token and Secret
5. Click **Add** then **Deploy**

### 3. Select Your Device

1. Click the 🔄 button to fetch your device list
2. Select a device from the dropdown
3. For SB Command: available commands will appear based on device type

## Usage Examples

### Get Sensor Data Every 5 Minutes

```
[Inject (5min interval)] → [SB Status] → [Debug]
```

### Turn On Air Conditioner

```
[Inject] → [SB Command (setAll: 26,1,1,on)] → [Debug]
```

### Motion-Triggered Automation

```
[Inject (30s interval)] → [SB Status (Presence Sensor)] → [Switch (msg.payload.detected)] → [Your Action]
```

## API Rate Limits

SwitchBot API has a limit of **10,000 requests per day**. Plan your polling intervals accordingly:

| Interval | Requests/Day (1 device) |
|----------|------------------------|
| 1 min    | 1,440                  |
| 5 min    | 288                    |
| 15 min   | 96                     |

## Troubleshooting

### "Token/Secret not configured"
Make sure you've added and **deployed** the credentials config node before fetching devices.

### "Device not found"
Ensure the device is registered in your SwitchBot account and the API credentials are correct.

### "API error: 401"
Your Token or Secret is invalid or expired. Regenerate them in the SwitchBot app.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [SwitchBot API Documentation](https://github.com/OpenWonderLabs/SwitchBotAPI)
- [Node-RED](https://nodered.org/)
- [Report Issues](https://github.com/saladdays/-node-red-switchbot/issues)
