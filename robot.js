var rpio = require('rpio');
var http = require('http');

var PORT = 18944;
var hostname = 'slicer-servername';

var AMT_READ = new Buffer([0x0]);

var header = {          // 58 bytes
	v: 2,               // uint16 (2 bytes)
    type: 'TRANSFORM',  // char[12] (12 bytes)
    device_name: 'e0',  // char[20] (20 bytes)
    time_stamp: 0,      // uint64 (8 bytes)
    body_size: 48,      // uint64 (8 bytes)
    crc64: 1            // uint64 (8 bytes)
}

var body = {            // 48 bytes
    a00: 1,             // 4 byte floats
    a10: 0,
    a20: 0,
    a01: 0,
    a11: 1,
    a21: 0,
    a02: 0,
    a12: 0,
    a22: 1,
    a03: 10,
    a13: 10,
    a23: 10
}

rpio.spiBegin();
rpio.spiSetDataMode(0);
rpio.spiChipSelect(0);
rpio.spiSetCSPolarity(0, rpio.HIGH);
rpio.spiSetClockDivider(1604);

var position = 0;

function getPositionSPI() {
	var binArr = [];
	var currPos = rwSPI(AMT_READ, false) << 8;
	rpio.usleep(3);
	currPos = currPos | rwSPI(AMT_READ, true);
	for(var i = 0; i < 16; i++) binArr[i] = 0x01 & (currPos >> i);
	if((binArr[15] == !(binArr[13] ^ binArr[11] ^ binArr[9] ^ binArr[7] ^ binArr[5] ^ binArr[3] ^ binArr[1])) & (binArr[14] == !(binArr[12] ^ binArr[10] ^ binArr[8] ^ binArr[6] ^ binArr[4] ^ binArr[2] ^ binArr[0]))) {
		currPos &= 0x3fff;
	} else {
		currPos = 0xffff;
	}
	return currPos;
}

function rwSPI(tx, releaseCS) {
	setCS(false);
	rpio.usleep(3);
	var rx = Buffer.alloc(tx.length);
	rpio.spiTransfer(tx, rx, tx.length);
	rpio.usleep(3);
	setCS(releaseCS);
	var b = rx.readUInt8();
	return b;
}

function setCS(cs) {
	if(cs) {
		rpio.spiSetCSPolarity(0, rpio.HIGH);
	} else {
		rpio.spiSetCSPolarity(0, rpio.LOW);
	}
}

var counter = 0;
while(true) {
	position = getPositionSPI();
	if(position !== 0xffff) {
		position *= 360/16384;
		console.log(position.toFixed(2));
	}
}
