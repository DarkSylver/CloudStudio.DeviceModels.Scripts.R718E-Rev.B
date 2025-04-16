//Test: # Packet 1: 011C01246A3E883E1F4100
// # Packet 2: 011C0212422B42C7440107

function parseUplink(device, payload) {
    var payloadb = payload.asBytes();
    var decoded = Decoder(payloadb, payload.port)
    env.log(decoded);

    // Store battery
    if (decoded.battery != null) {
        var sensor1 = device.endpoints.byAddress("1");

        if (sensor1 != null)
            sensor1.updateVoltageSensorStatus(decoded.battery);

        if (decoded.lowBattery) {
            device.updateDeviceBattery({ voltage: decoded.battery, state: batteryState.low });
        }
        else {
            device.updateDeviceBattery({ voltage: decoded.battery });
        }
    };

    // Store Acceleration X

    if (decoded.accelerationx != null) {
        var sensor2 = device.endpoints.byAddress("2");

        if (sensor2 != null)
            sensor2.updateGenericSensorStatus(decoded.accelerationx);
    };
    // Store Acceleration Y

    if (decoded.accelerationy != null) {
        var sensor3 = device.endpoints.byAddress("3");

        if (sensor3 != null)
            sensor3.updateGenericSensorStatus(decoded.accelerationy);
    };
    // Store Acceleration Z

    if (decoded.accelerationz != null) {
        var sensor4 = device.endpoints.byAddress("4");

        if (sensor4 != null)
            sensor4.updateGenericSensorStatus(decoded.accelerationz);
    };

    // Store Velocity X

    if (decoded.velocityx != null) {
        var sensor5 = device.endpoints.byAddress("5");

        if (sensor5 != null)
            sensor5.updateGenericSensorStatus(decoded.velocityx);
    };


    // Store Velocity Y

    if (decoded.velocityy != null) {
        var sensor6 = device.endpoints.byAddress("6");

        if (sensor6 != null)
            sensor6.updateGenericSensorStatus(decoded.velocityy);
    };

    // Store Velocity Z

    if (decoded.velocityz != null) {
        var sensor7 = device.endpoints.byAddress("7");

        if (sensor7 != null)
            sensor7.updateGenericSensorStatus(decoded.velocityz);
    };

    // Store Temperature

    if (decoded.temperature != null) {
        var sensor8 = device.endpoints.byAddress("8");

        if (sensor8 != null)
            sensor8.updateTemperatureSensorStatus(decoded.temperature);
    };
}


function Decoder(bytes, fport) {
    var decoded = {};
    if (fport === 6) { // then its ReportDataCmd
        if (bytes[2] === 0x00) { // version report
            decoded.devicetype = "ALL";
            decoded.softwareversion = bytes[3];
            decoded.hardwareversion = bytes[4];
            decoded.datecode = bcdtonumber(bytes.slice(5, 9));
            return decoded;
        } else if ((bytes[1] === 0x1C) && (bytes[2] === 0x01)) { // device type 1C (R718E) and report type 01
            decoded.devicetype = "R718E";
            decoded.battery = (bytes[3] & 0b01111111) / 10;
            decoded.lowBattery = (bytes[3] & 0b10000000) != 0;
            decoded.accelerationx = bytestofloat16((bytes[5] << 8) + bytes[4]);
            decoded.accelerationy = bytestofloat16((bytes[7] << 8) + bytes[6]);
            decoded.accelerationz = bytestofloat16((bytes[9] << 8) + bytes[8]);
            return decoded;
        } else if ((bytes[1] === 0x1C) && (bytes[2] === 0x02)) {
            // full data is split over two separate uplink messages
            decoded.velocityx = bytestofloat16((bytes[4] << 8) + bytes[3]);
            decoded.velocityy = bytestofloat16((bytes[6] << 8) + bytes[5]);
            decoded.velocityz = bytestofloat16((bytes[8] << 8) + bytes[7]);
            decoded.temperature = ((bytes[9] << 24 >> 16) + bytes[10]) / 10;
            return decoded;
        }
       
    } else if (fport === 7) { // then its a ConfigureCmd response
        if ((bytes[0] === 0x82) && (bytes[1] === 0x01)) { // R711 or R712
            decoded.mintime = ((bytes[2] << 8) + bytes[3]);
            decoded.maxtime = ((bytes[4] << 8) + bytes[5]);
            decoded.battchange = bytes[6] / 10;
            decoded.tempchange = ((bytes[7] << 8) + bytes[8]) / 100;
            decoded.humidchange = ((bytes[9] << 8) + bytes[10]) / 100;
        } else if ((bytes[0] === 0x81) && (bytes[1] === 0x01)) { // R711 or R712
            decoded.success = bytes[2];
        }
    }
    return decoded;
}


function bcdtonumber(bytes) {
    var num = 0;
    var m = 1;
    var i;
    for (i = 0; i < bytes.length; i++) {
        num += (bytes[bytes.length - 1 - i] & 0x0F) * m;
        num += ((bytes[bytes.length - 1 - i] >> 4) & 0x0F) * m * 10;
        m *= 100;
    }
    return num;
}

function bytestofloat16(bytes) {
    var sign = (bytes & 0x8000) ? -1 : 1;
    var exponent = ((bytes >> 7) & 0xFF) - 127;
    var significand = (bytes & ~(-1 << 7));

    if (exponent == 128)
        return 0.0;

    if (exponent == -127) {
        if (significand == 0) return sign * 0.0;
        exponent = -126;
        significand /= (1 << 6);
    } else significand = (significand | (1 << 7)) / (1 << 7);

    return sign * significand * Math.pow(2, exponent);
}

