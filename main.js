'use strict';

/*
* Created with @iobroker/create-adapter v1.11.0
*/

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
// const fs = require("fs");
var net = require('net');
var matrix;
var recnt;
var connection = false;
var query = null;
var in_msg = '';
var iMaxTryCounter = 0;
var iMaxTimeoutCounter = 0;
var lastCMD;
var parentThis;
var arrCMD = [];
var arrStateQuery_Input = [];
var arrStateQuery_Output = [];
var arrStateQuery_Routing = [];

var bQueryComplete_Routing;
var bQueryComplete_Input;
var bQueryComplete_Output;

var idDevice = 0x01;
var firmware = 0x45;

var cmdConnect =    new Buffer([0xf0, firmware, idDevice, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdDisconnect = new Buffer([0xf0, firmware, idDevice, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdGain =       new Buffer([0xf0, firmware, idDevice, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdRoute =      new Buffer([0xf0, firmware, idDevice, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
//var cmdPreset =     new Buffer([0xf0, firmware, idDevice, 0x1B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdReadmemory=  new Buffer([0xf0, firmware, idDevice, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdWritememory= new Buffer([0xf0, firmware, idDevice, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);

var bWaitingForResponse = false;
var bQueryDone;
var bQueryInProgress;

//----Routing Memory Location
var out0_in0_Hi = 0x00;
var out0_in0_Lo = 0x48;
var out0_in1_Hi = 0x00;
var out0_in1_Lo = 0x49;
var out0_in2_Hi = 0x00;
var out0_in2_Lo = 0x4A;
var out0_in3_Hi = 0x00;
var out0_in3_Lo = 0x4B;
var out0_in4_Hi = 0x00;
var out0_in4_Lo = 0x4C;
var out0_in5_Hi = 0x00;
var out0_in5_Lo = 0x4D;
var out0_in6_Hi = 0x00;
var out0_in6_Lo = 0x4E;
var out0_in7_Hi = 0x00;
var out0_in7_Lo = 0x4F;
var out1_in0_Hi = 0x00;
var out1_in0_Lo = 0x7C;
var out1_in1_Hi = 0x00;
var out1_in1_Lo = 0x7D;
var out1_in2_Hi = 0x00;
var out1_in2_Lo = 0x7E;
var out1_in3_Hi = 0x00;
var out1_in3_Lo = 0x7F;
var out1_in4_Hi = 0x00;
var out1_in4_Lo = 0x80;
var out1_in5_Hi = 0x00;
var out1_in5_Lo = 0x81;
var out1_in6_Hi = 0x00;
var out1_in6_Lo = 0x82;
var out1_in7_Hi = 0x00;
var out1_in7_Lo = 0x83;
var out2_in0_Hi = 0x00;
var out2_in0_Lo = 0xB0;
var out2_in1_Hi = 0x00;
var out2_in1_Lo = 0xB1;
var out2_in2_Hi = 0x00;
var out2_in2_Lo = 0xB2;
var out2_in3_Hi = 0x00;
var out2_in3_Lo = 0xB3;
var out2_in4_Hi = 0x00;
var out2_in4_Lo = 0xB4;
var out2_in5_Hi = 0x00;
var out2_in5_Lo = 0xB5;
var out2_in6_Hi = 0x00;
var out2_in6_Lo = 0xB6;
var out2_in7_Hi = 0x00;
var out2_in7_Lo = 0xB7;

var out3_in0_Hi = 0x00;
var out3_in0_Lo = 0xE4;
var out3_in1_Hi = 0x00;
var out3_in1_Lo = 0xE5;
var out3_in2_Hi = 0x00;
var out3_in2_Lo = 0xE6;
var out3_in3_Hi = 0x00;
var out3_in3_Lo = 0xE7;
var out3_in4_Hi = 0x00;
var out3_in4_Lo = 0xE8;
var out3_in5_Hi = 0x00;
var out3_in5_Lo = 0xE9;
var out3_in6_Hi = 0x00;
var out3_in6_Lo = 0xEA;
var out3_in7_Hi = 0x00;
var out3_in7_Lo = 0xEB;
var out4_in0_Hi = 0x01;
var out4_in0_Lo = 0x18;
var out4_in1_Hi = 0x01;
var out4_in1_Lo = 0x19;
var out4_in2_Hi = 0x01;
var out4_in2_Lo = 0x1A;
var out4_in3_Hi = 0x01;
var out4_in3_Lo = 0x1B;
var out4_in4_Hi = 0x01;
var out4_in4_Lo = 0x1C;
var out4_in5_Hi = 0x01;
var out4_in5_Lo = 0x1D;
var out4_in6_Hi = 0x01;
var out4_in6_Lo = 0x1E;
var out4_in7_Hi = 0x01;
var out4_in7_Lo = 0x1F;
var out5_in0_Hi = 0x01;
var out5_in0_Lo = 0x4C;
var out5_in1_Hi = 0x01;
var out5_in1_Lo = 0x4D;
var out5_in2_Hi = 0x01;
var out5_in2_Lo = 0x4E;
var out5_in3_Hi = 0x01;
var out5_in3_Lo = 0x4F;
var out5_in4_Hi = 0x01;
var out5_in4_Lo = 0x50;
var out5_in5_Hi = 0x01;
var out5_in5_Lo = 0x51;
var out5_in6_Hi = 0x01;
var out5_in6_Lo = 0x52;
var out5_in7_Hi = 0x01;
var out5_in7_Lo = 0x53;
var out6_in0_Hi = 0x01;
var out6_in0_Lo = 0x80;
var out6_in1_Hi = 0x01;
var out6_in1_Lo = 0x81;
var out6_in2_Hi = 0x01;
var out6_in2_Lo = 0x82;
var out6_in3_Hi = 0x01;
var out6_in3_Lo = 0x83;
var out6_in4_Hi = 0x01;
var out6_in4_Lo = 0x84;
var out6_in5_Hi = 0x01;
var out6_in5_Lo = 0x85;
var out6_in6_Hi = 0x01;
var out6_in6_Lo = 0x86;
var out6_in7_Hi = 0x01;
var out6_in7_Lo = 0x87;
var out7_in0_Hi = 0x01;
var out7_in0_Lo = 0xB4;
var out7_in1_Hi = 0x01;
var out7_in1_Lo = 0xB5;
var out7_in2_Hi = 0x01;
var out7_in2_Lo = 0xB6;
var out7_in3_Hi = 0x01;
var out7_in3_Lo = 0xB7;
var out7_in4_Hi = 0x01;
var out7_in4_Lo = 0xB8;
var out7_in5_Hi = 0x01;
var out7_in5_Lo = 0xB9;
var out7_in6_Hi = 0x01;
var out7_in6_Lo = 0xBA;
var out7_in7_Hi = 0x01;
var out7_in7_Lo = 0xBB;

//----InputGain; Adressen sind abgebildet per 2 Byte
var inGain_0_HiVal_Lo = 0x40;
var inGain_0_HiVal_Hi = 0x00;
var inGain_1_HiVal_Lo = 0x41;
var inGain_1_HiVal_Hi = 0x00;
var inGain_2_HiVal_Lo = 0x42;
var inGain_2_HiVal_Hi = 0x00;
var inGain_3_HiVal_Lo = 0x43;
var inGain_3_HiVal_Hi = 0x00;
var inGain_4_HiVal_Lo = 0x44;
var inGain_4_HiVal_Hi = 0x00;
var inGain_5_HiVal_Lo = 0x45;
var inGain_5_HiVal_Hi = 0x00;
var inGain_6_HiVal_Lo = 0x46;
var inGain_6_HiVal_Hi = 0x00;
var inGain_7_HiVal_Lo = 0x47;
var inGain_7_HiVal_Hi = 0x00;
var inGain_0_LoVal_Lo = 0x18;
var inGain_0_LoVal_Hi = 0x02;
var inGain_1_LoVal_Lo = 0x19;
var inGain_1_LoVal_Hi = 0x02;
var inGain_2_LoVal_Lo = 0x1A;
var inGain_2_LoVal_Hi = 0x02;
var inGain_3_LoVal_Lo = 0x1B;
var inGain_3_LoVal_Hi = 0x02;
var inGain_4_LoVal_Lo = 0x1C;
var inGain_4_LoVal_Hi = 0x02;
var inGain_5_LoVal_Lo = 0x1D;
var inGain_5_LoVal_Hi = 0x02;
var inGain_6_LoVal_Lo = 0x1E;
var inGain_6_LoVal_Hi = 0x02;
var inGain_7_LoVal_Lo = 0x1F;
var inGain_7_LoVal_Hi = 0x02;

var vol_0_HiVal_Lo = 0x7B;
var vol_0_HiVal_Hi = 0x00;
var vol_0_LoVal_Lo = 0x07;
var vol_0_LoVal_Hi = 0x02;
var vol_1_HiVal_Lo = 0xAF;
var vol_1_HiVal_Hi = 0x00;
var vol_1_LoVal_Lo = 0x08;
var vol_1_LoVal_Hi = 0x02;
var vol_2_HiVal_Lo = 0xE3;
var vol_2_HiVal_Hi = 0x00;
var vol_2_LoVal_Lo = 0x09;
var vol_2_LoVal_Hi = 0x02;
var vol_3_HiVal_Lo = 0x17;
var vol_3_HiVal_Hi = 0x01;
var vol_3_LoVal_Lo = 0x0A;
var vol_3_LoVal_Hi = 0x02;
var vol_4_HiVal_Lo = 0x4B;
var vol_4_HiVal_Hi = 0x01;
var vol_4_LoVal_Lo = 0x0B;
var vol_4_LoVal_Hi = 0x02;
var vol_5_HiVal_Lo = 0x7F;
var vol_5_HiVal_Hi = 0x01;
var vol_5_LoVal_Lo = 0x0C;
var vol_5_LoVal_Hi = 0x02;
var vol_6_HiVal_Lo = 0xB3;
var vol_6_HiVal_Hi = 0x01;
var vol_6_LoVal_Lo = 0x0D;
var vol_6_LoVal_Hi = 0x02;
var vol_7_HiVal_Lo = 0xE7;
var vol_7_HiVal_Hi = 0x01;
var vol_7_LoVal_Lo = 0x0E;
var vol_7_LoVal_Hi = 0x02;

var arrQuery =[
//----Routing
new Buffer([0xf0, firmware, idDevice, 0x10, out0_in0_Hi, out0_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out0_in1_Hi, out0_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out0_in2_Hi, out0_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out0_in3_Hi, out0_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out0_in4_Hi, out0_in4_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out0_in5_Hi, out0_in5_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out0_in6_Hi, out0_in6_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out0_in7_Hi, out0_in7_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out1_in0_Hi, out1_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out1_in1_Hi, out1_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out1_in2_Hi, out1_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out1_in3_Hi, out1_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out1_in4_Hi, out1_in4_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out1_in5_Hi, out1_in5_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out1_in6_Hi, out1_in6_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out1_in7_Hi, out1_in7_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out2_in0_Hi, out2_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out2_in1_Hi, out2_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out2_in2_Hi, out2_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out2_in3_Hi, out2_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out2_in4_Hi, out2_in4_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out2_in5_Hi, out2_in5_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out2_in6_Hi, out2_in6_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out2_in7_Hi, out2_in7_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out3_in0_Hi, out3_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out3_in1_Hi, out3_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out3_in2_Hi, out3_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out3_in3_Hi, out3_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out3_in4_Hi, out3_in4_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out3_in5_Hi, out3_in5_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out3_in6_Hi, out3_in6_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out3_in7_Hi, out3_in7_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out4_in0_Hi, out4_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out4_in1_Hi, out4_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out4_in2_Hi, out4_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out4_in3_Hi, out4_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out4_in4_Hi, out4_in4_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out4_in5_Hi, out4_in5_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out4_in6_Hi, out4_in6_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out4_in7_Hi, out4_in7_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out5_in0_Hi, out5_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out5_in1_Hi, out5_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out5_in2_Hi, out5_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out5_in3_Hi, out5_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out5_in4_Hi, out5_in4_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out5_in5_Hi, out5_in5_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out5_in6_Hi, out5_in6_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out5_in7_Hi, out5_in7_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out6_in0_Hi, out6_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out6_in1_Hi, out6_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out6_in2_Hi, out6_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out6_in3_Hi, out6_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out6_in4_Hi, out6_in4_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out6_in5_Hi, out6_in5_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out6_in6_Hi, out6_in6_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out6_in7_Hi, out6_in7_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out7_in0_Hi, out7_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out7_in1_Hi, out7_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out7_in2_Hi, out7_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out7_in3_Hi, out7_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out7_in4_Hi, out7_in4_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out7_in5_Hi, out7_in5_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out7_in6_Hi, out7_in6_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, out7_in7_Hi, out7_in7_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

//----InGain
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_0_HiVal_Hi, inGain_0_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_0_LoVal_Hi, inGain_0_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_1_HiVal_Hi, inGain_1_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_1_LoVal_Hi, inGain_1_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_2_HiVal_Hi, inGain_2_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_2_LoVal_Hi, inGain_2_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_3_HiVal_Hi, inGain_3_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_3_LoVal_Hi, inGain_3_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_4_HiVal_Hi, inGain_4_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_4_LoVal_Hi, inGain_4_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_5_HiVal_Hi, inGain_5_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_5_LoVal_Hi, inGain_5_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_6_HiVal_Hi, inGain_6_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_6_LoVal_Hi, inGain_6_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_7_HiVal_Hi, inGain_7_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, inGain_7_LoVal_Hi, inGain_7_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

//----Volume
new Buffer([0xf0, firmware, idDevice, 0x10, vol_0_HiVal_Hi, vol_0_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_0_LoVal_Hi, vol_0_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_1_HiVal_Hi, vol_1_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_1_LoVal_Hi, vol_1_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_2_HiVal_Hi, vol_2_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_2_LoVal_Hi, vol_2_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_3_HiVal_Hi, vol_3_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_3_LoVal_Hi, vol_3_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_4_HiVal_Hi, vol_4_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_4_LoVal_Hi, vol_4_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_5_HiVal_Hi, vol_5_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_5_LoVal_Hi, vol_5_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_6_HiVal_Hi, vol_6_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_6_LoVal_Hi, vol_6_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_7_HiVal_Hi, vol_7_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
new Buffer([0xf0, firmware, idDevice, 0x10, vol_7_LoVal_Hi, vol_7_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
];


//----Caching der Gain-Werte: Hi, Lo
/*
var inGain_0 = [-1, -1];
var inGain_1 = [-1, -1];
var inGain_2 = [-1, -1];
var inGain_3 = [-1, -1];
var inGain_4 = [-1, -1];
var inGain_5 = [-1, -1];
var inGain_6 = [-1, -1];
var inGain_7 = [-1, -1];
*/

var inGain = [
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1]
];



//----Das Volume, BEVOR es inst Routing geht. 
var volume = [
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1],
[-1, -1]
];


//----Das Volume eines Ausgangs NACH dem Rounting.
//----Hiermit lassen sich Anforderungen realisieren: 'Theke lauter'.
//----Technisch bildet dieser Wert die Guete des Routing-Knotens ab.
var arrOutputRoutingState = [];

//----Die Guete der Knoten: Eine Spalte in der Mixing-Matrix
var arrPostRoutingVolume = [0, 0, 0, 0, 0, 0, 0, 0];

//----Cahing zum spateren Speichern
var arrInputGain = [0, 0, 0, 0, 0, 0, 0, 0];
var arrOutputGain = [0, 0, 0, 0, 0, 0, 0, 0];

class Audiomatrix880 extends utils.Adapter {

    /**
    * @param {Partial<ioBroker.AdapterOptions>} [options={}]
    */
    constructor(options) {
        super({
            ...options,
            name: 'audiomatrix_880',
        });
        
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
        parentThis = this;
    }

    toHexString(byteArray) {
        return Array.from(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }

    //----26 chars to one 13-element Array
    toArray(response){
        var chunks = [];
        for (var i = 0, charsLength = response.length; i < charsLength; i += 2) {
            chunks.push(parseInt(response.substring(i, i + 2), 16));
        }
        return chunks;
    }

    initmatrix(){
        //this.log.info('initMatrix().');
        this.connectmatrix();                                                  
    }

    reconnect(){
        this.log.info('AudioMatrix: reconnectMatrix()');
        connection = false;
        clearInterval(query);
        clearTimeout(recnt);
        matrix.destroy();

        this.log.info('AudioMatrix: Reconnect after 15 sec...');
        this.setState('info.connection', false, true);
        //this.setConnState(false, false);
        recnt = setTimeout(function() {
            parentThis.initmatrix();
        }, 15000);
    }

    pingMatrix(){
        this.log.info('AudioMatrix: pingMatrix()' );
        //this.send(cmdConnect);
        arrCMD.push(cmdConnect);
        iMaxTryCounter = 3;
        this.processCMD();
    }

    //----Fragt die Werte vom Geraet ab.
    queryMatrix(){                
        this.log.info('AudioMatrix: queryMatrix(). arrCMD.length vorher=' + arrCMD.length.toString());                      
        bQueryInProgress  = true;
	this.setState('queryState', true, true);
        arrQuery.forEach(function(item, index, array) {                             
            //parentThis.log.info('AudioMatrix: queryMatrix(). pushing:' + parentThis.toHexString(item));
            arrCMD.push(item);
        });
        this.log.info('AudioMatrix: queryMatrix(). arrCMD.length hinterher=' + arrCMD.length.toString());
        iMaxTryCounter = 3;
        this.processCMD();
    }

    connectmatrix(cb){
        var host = this.config.host;
        var port = this.config.port;
        var tmpFirmware = this.config.firmware;                           
        var tmpFirmwareName;
        
        bQueryDone = false;
        bQueryInProgress=false;

        bQueryComplete_Routing = false;
        bQueryComplete_Input = false;
        bQueryComplete_Output = false;

	arrOutputRoutingState = [];
	for (var i = 0; i < 64; i++) {
            arrOutputRoutingState.push(false);
	}

	arrStateQuery_Input = [];
	for (var i = 1; i < 9; i++) {
            arrStateQuery_Input.push(false);
	}

	arrStateQuery_Output = [];
	for (var i = 1; i < 9; i++) {
            arrStateQuery_Output.push(false);
	}

	arrStateQuery_Routing = [];
	for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                arrStateQuery_Routing.push(false);
	    }
        }


        if(tmpFirmware=='v14'){
            //this.reconfigureCMD(0x45);
            tmpFirmwareName = 'v1.4';
            firmware = 0x45;
        }else if(tmpFirmware=='v16'){
            //this.reconfigureCMD(0x46);
            tmpFirmwareName = 'v1.6';
            firmware = 0x46;
        }

        this.log.info('AudioMatrix: connecting to: ' + this.config.host + ':' + this.config.port + ' Firmware Version:' + tmpFirmwareName);

        matrix = new net.Socket();
        matrix.connect(this.config.port, this.config.host, function() {
            clearInterval(query);
            query = setInterval(function() {
//                if(!tabu){             //----Damit nicht gepolled wird, wenn gerade etwas anderes stattfindet.
                    if(connection==false){
			if(bWaitingForResponse==false){
	                        parentThis.log.info('AudioMatrix: connectMatrix().connection==false, sending CMDCONNECT:' + parentThis.toHexString(cmdConnect));
        	                arrCMD.push(cmdConnect);
        	                iMaxTryCounter = 3;
        	                parentThis.processCMD();
			}else{
				parentThis.log.info('AudioMatrix: connectMatrix().connection==false, bWaitingForResponse==false; nichts machen');
			}
                    }else{
                        if(bQueryDone==true){
                            if(arrCMD.length==0){
	                        parentThis.log.debug('AudioMatrix: connectMatrix().connection==true, bQueryDone==TRUE, idle, pinging Matrix');
        	                parentThis.pingMatrix();                                                                                                          
                            }else{
                                parentThis.log.debug('AudioMatrix: connectMatrix().connection==true, bQueryDone==TRUE, arrCMD.length>0; idle, aber KEIN ping auf Matrix');
                            }
                        }else{
                            if(!bQueryInProgress){
                                parentThis.log.debug('AudioMatrix: connectMatrix().connection==true, bQueryDone==FALSE, idle, query Matrix');                            
                                parentThis.queryMatrix();
                            }
                        }                                                                                           
                    }

                    //----Intervall fuer Befehle, Timeouts, etc
                    setTimeout(function(){
                        //parentThis.log.info('AudioMatrix: connectMatrix(): kleines Timeout');
                        if(bWaitingForResponse==true){
                            if(bQueryInProgress==false){
			            if(iMaxTryCounter>0){
			                //----Es kann passieren, dass man direkt NACH dem Senden eines Befehls an die Matrix und VOR der Antwort hier landet.
			                //----deswegen wird erstmal der MaxTryCounter heruntergesetzt und -sofern nichts kommt- bis zum naechsten Timeout gewartet.
			                //----Wenn iMaxTryCounter==0 ist, koennen wir von einem Problem ausgehen
			                parentThis.log.info('AudioMatrix: connectMatrix(): kleines Timeout. bWaitingForResponse==TRUE iMaxTryCounter==' + iMaxTryCounter.toString() );
			                parentThis.log.info('AudioMatrix: connectMatrix(): kleines Timeout. lastCMD =' + parentThis.toHexString(lastCMD) + ' nichts tun, noch warten');
			                iMaxTryCounter--;   
					parentThis.setState('minorProblem', true, true);
			            }else{
			                if(iMaxTimeoutCounter<3){
			                    parentThis.log.info('AudioMatrix: connectMatrix() in_msg: kleines Timeout. bWaitingForResponse==TRUE iMaxTryCounter==0. Erneutes Senden von ' + parentThis.toHexString(lastCMD));
			                    iMaxTimeoutCounter++;
			                    iMaxTryCounter=3;
			                    if(lastCMD !== undefined){
			                        setTimeout(function() {
			                            matrix.write(lastCMD);            
			                        }, 100);
			                    }
			                }else{
			                    parentThis.log.error('AudioMatrix: connectMatrix() in_msg: kleines Timeout. bWaitingForResponse==TRUE iMaxTryCounter==0. Erneutes Senden von ' + parentThis.toHexString(lastCMD) + 'schlug mehrfach fehl');
			                    iMaxTimeoutCounter=0;
			                    parentThis.log.error('AudioMatrix: connectMatrix() in_msg: kleines Timeout. bWaitingForResponse==TRUE iMaxTryCounter==0');
			                    //parentThis.log.error('WIE reagieren wir hier drauf? Was ist, wenn ein Befehl nicht umgesetzt werden konnte?');
			                    bWaitingForResponse=false;
			                    lastCMD = '';
			                    in_msg = '';
			                    arrCMD = [];
			                    parentThis.reconnect();
			                }
			            }
                            }else{
				parentThis.setState('minorProblem', true, true);
				if(connection==true){
                                    parentThis.log.info('AudioMatrix: connectMatrix(): kleines Timeout. bWaitingForResponse==TRUE, bQueryInProgress==TRUE. Abwarten. iMaxTryCounter==' + iMaxTryCounter.toString() );
                                }else{
                                    //----Fuer den Fall, dass der Verbindungsversuch fehlschlaegt
                                    parentThis.log.info('AudioMatrix: connectMatrix(): kleines Timeout. bWaitingForResponse==TRUE, bQueryInProgress==TRUE. Connection==FALSE. iMaxTryCounter==' + iMaxTryCounter.toString() );
				    bWaitingForResponse=false;
                                    iMaxTryCounter--;
                                }
                            }
                        }else{
                            //parentThis.log.debug('AudioMatrix: connectMatrix() in_msg: kleines Timeout. bWaitingForResponse==FALSE, kein Problem');
                        }
                    }, 333/*kleinesIntervall*/);

//                }else{
//                    parentThis.log.debug('AudioMatrix: connectMatrix().Im Ping-Intervall aber tabu==TRUE. Nichts machen.');
//                }
            }, 5000);

            if(cb){
                cb();
            }                             
        });

        matrix.on('data', function(chunk) {
            in_msg += parentThis.toHexString(chunk);

            if(bWaitingForResponse==true){                                                                          
                if((in_msg.length >= 26) && (in_msg.includes('f0'))){
                    //parentThis.log.debug('AudioMatrix: matrix.on data(); in_msg ist lang genug und enthaelt f0:' + in_msg);
                    var iStartPos = in_msg.indexOf('f0');
                    if(in_msg.toLowerCase().substring(iStartPos+24,iStartPos+26)=='f7'){                                                                                              
                        bWaitingForResponse = false;
                        var tmpMSG = in_msg.toLowerCase().substring(iStartPos,iStartPos+26);
                        parentThis.log.debug('AudioMatrix: matrix.on data(); filtered:' + tmpMSG);
                        parentThis.bWaitingForResponse = false;
                        parentThis.parseMsg(tmpMSG);
                        in_msg = '';
                        lastCMD = '';
                        //iMaxTryCounter = 3;
                        iMaxTimeoutCounter = 0;
                        parentThis.processCMD();                        
                    }else{
                        //----Irgendwie vergniesgnaddelt
                        parentThis.log.info('AudioMatrix: matrix.on data: Fehlerhafte oder inkomplette Daten empfangen:' + in_msg);                                                                                                   
                    }                                                                                           
                }
            }else{
                parentThis.log.info('AudioMatrix: matrix.on data(): incomming aber bWaitingForResponse==FALSE; in_msg:' + in_msg);
            }

            if(in_msg.length > 60){
                //----Just in case
                in_msg = '';
            }
        });

        matrix.on('timeout', function(e) {
            //if (e.code == "ENOTFOUND" || e.code == "ECONNREFUSED" || e.code == "ETIMEDOUT") {
            //            matrix.destroy();
            //}
            parentThis.log.error('AudioMatrix TIMEOUT');
            //parentThis.connection=false;
            //parentThis.setConnState(false, true);
            parentThis.reconnect();
        });

        matrix.on('error', function(e) {
            if (e.code == "ENOTFOUND" || e.code == "ECONNREFUSED" || e.code == "ETIMEDOUT") {
                matrix.destroy();
            }
            parentThis.log.error(e);
            parentThis.reconnect();
        });

        matrix.on('close', function(e) {
            if(connection){
                parentThis.log.error('AudioMatrix closed');
            }
            //parentThis.reconnect();
        });

        matrix.on('disconnect', function(e) {
            parentThis.log.error('AudioMatrix disconnected');
            parentThis.reconnect();
        });

        matrix.on('end', function(e) {
            parentThis.log.error('AudioMatrix ended');
            //parentThis.setConnState(false, true);                                            
        });
    }

    //----Befehle an die Hardware werden in einer Queue geparkt und hier verarbeitet.
    processCMD(){
        if(!bWaitingForResponse){
            if(arrCMD.length>0){
                this.log.debug('AudioMatrix: processCMD: bWaitingForResponse==FALSE, arrCMD.length=' +arrCMD.length.toString());
                bWaitingForResponse=true;
                var tmp = arrCMD.shift();
                this.log.debug('AudioMatrix: processCMD: next CMD=' + this.toHexString(tmp) + ' arrCMD.length rest=' +arrCMD.length.toString());
                lastCMD = tmp;
                setTimeout(function() {
                    matrix.write(tmp);           
                }, 100);
            }else{
                this.log.debug('AudioMatrix: processCMD: bWaitingForResponse==FALSE, arrCMD ist leer. Kein Problem');
            }
        }else{
            this.log.debug('AudioMatrix: processCMD: bWaitingForResponse==TRUE. Nichts machen');
        }

        //----Anzeige der Quelength auf der Oberflaeche
        this.setStateAsync('queuelength', { val: arrCMD.length, ack: true });
    }

    //----stellt fest, ob das Abfragen der Werte vollstaendig ist.
    checkQueryDone(){                     
        //----Routing
        if(bQueryComplete_Routing==false){
            var bTMP_Routing = true;
            arrStateQuery_Routing.forEach(function(item, index, array) {                
                bTMP_Routing = bTMP_Routing && item;
            });
            bQueryComplete_Routing = bTMP_Routing;
            this.log.info('checkQueryDone(): Routing:' + bQueryComplete_Routing);
        }else{
            this.log.info('checkQueryDone(): Abfrage auf Routing bereits komplett.');
        }
        
        //----Input Gain
        if(bQueryComplete_Input==false){
            var bTMP_Input = true;
            arrStateQuery_Input.forEach(function(item, index, array) {                    
                bTMP_Input = bTMP_Input && item;
            });
            bQueryComplete_Input = bTMP_Input;
            this.log.info('checkQueryDone(): Input:' + bQueryComplete_Input);
        }else{
            this.log.info('checkQueryDone(): Abfrage auf InputGain bereits komplett.');
        }
        
        //----Output Volume
        if(bQueryComplete_Output==false){
            var bTMP_Output = true;
            arrStateQuery_Output.forEach(function(item, index, array) {                 
                bTMP_Output = bTMP_Output && item;
            });
            bQueryComplete_Output = bTMP_Output;
            this.log.info('checkQueryDone(): Output:' + bQueryComplete_Output);
        }else{
            this.log.info('checkQueryDone(): Abfrage auf OutputVolume bereits komplett.');
        }
        
        bQueryDone = bQueryComplete_Routing && bQueryComplete_Input && bQueryComplete_Output;
	//this.setState('info.connection', bQueryDone, true);

        if(bQueryDone){
            bQueryInProgress=false;
            this.setState('queryState', false, true);
        }
    }

    //----Schaltet das Routing binaer: Voll AN, voll AUS
    setRoutingState(outIndex, inIndex, onoff){	
        //this.log.info('setRoutingState() Out:' + outIndex.toString() + ' In:' + inIndex.toString() + ' Val:' + onoff.toString() );
        //this.log.info('setRoutingState() outputroutestate_' + (inIndex*8 + outIndex).toString());
        this.setStateAsync('outputroutestate_' + (inIndex*8 + outIndex+1).toString(), { val: onoff, ack: true });
	arrOutputRoutingState[inIndex*8 + outIndex] = onoff; 
        arrStateQuery_Routing[inIndex*8 + outIndex] = true;
        this.checkQueryDone();
    }


    //----Routing mit Angabe der 'Guete' des Routing-Knotens
    setRoutingStateValue(outIndex, inIndex, val){
	
	//----Zuerst das grundsetzliche Routing: Knoten aktiv/ inaktiv.
	//----Obacht: Es ist moeglich, dass der Knoten aktiv ist, aber die Guete des Knotens auf 0 heruntergeregelt ist.
	if(val<128){
	    this.setStateAsync('outputroutestate_' + (inIndex*8 + outIndex+1).toString(), { val: true, ack: true });
	    //----es wird aktiv nur TRUE gesetzt.
	    arrOutputRoutingState[inIndex*8 + outIndex] = true;
	}else{
	    this.setStateAsync('outputroutestate_' + (inIndex*8 + outIndex+1).toString(), { val: false, ack: true });
	    arrOutputRoutingState[inIndex*8 + outIndex] = false;
	    //Der Array wird auf FALSE initialisiert.
	    //arrOutputRoutingState[outIndex] = false;
	}
	

	//----Die Guete des Knotens
	//----Theoretisch gibt es hier 64 Moeglichkeiten, wir regeln aber ALLE Inputs fuer jeden Ausgang gemeinsam.
	//----Damit nimmt man sich einerseits die Moeglichkeit fuer differenzierte Einstellungen,
	//----Andererseits kann man damit aber eben unabhaengig vom Routing mit einem Fader z.B. "Theke lauter" einstellen.
	//----
	//----Es werden hier beim Einlesen nur die Inputs fuer den letzten Ausgang hinterlegt. Das ist eigentlich falsch.
	//----Weil wir aber eh alle Werte fuer einen Ausgang identisch behandeln, ist das okay und mit dem ersten Setzen eines Ausgangs wieder korrekt.
	if(val>=128){
	    val -= 128;
	}
	val = val*100/30;
	this.setStateAsync('outputgainpostrouting_' + (outIndex+1).toString(), { val, ack: true });
	arrPostRoutingVolume[outIndex] = val;
        
        arrStateQuery_Routing[inIndex*8 + outIndex] = true;
        this.checkQueryDone();
    }

    setInputGain(gainIndex){
        //this.log.info('setInputGain() gainIndex:' + gainIndex.toString() + ' Hi:' + inGain[gainIndex][0].toString() + ' Lo:' + inGain[gainIndex][1].toString() );
        if((inGain[gainIndex][0]>-1) && (inGain[gainIndex][1]>-1)){
            //this.log.info('setInputGain() gainIndex:' + gainIndex.toString() + ' Hi:' + inGain[gainIndex][0].toString() + ' Lo:' + inGain[gainIndex][1].toString() );
            var gainVal = inGain[gainIndex][0]*256 + inGain[gainIndex][1];
            //this.log.info('setInputGain() gainValue' + gainIndex.toString() + ':' + gainVal.toString() );

	    arrInputGain[gainIndex] = gainVal;	//Caching, damit der Wert ohne getState(...) griffbereit ist

            //----Normalisieren auf 0..100                 
            gainVal /=13.9;
            //this.log.info('setInputGain() NORMALIZED gainValue' + gainIndex.toString() + ':' + gainVal.toString() );
            this.setStateAsync('inputgain_' + (gainIndex+1).toString(), { val: gainVal, ack: true });
            inGain[gainIndex][0] = -1;
            inGain[gainIndex][1] = -1;          

            arrStateQuery_Input[gainIndex] = true;
            this.checkQueryDone();
        }
    }

    //----Das ist das Volume fuer das Signal, BEVOR es ins Routing geht. 
    //----setVolume(volumeIndoex eignet sich nicht fuer 'Theke lauter')
    setVolume(volumeIndex){
        //this.log.info('setVolume() volumeIndex:' + volumeIndex.toString() + ' Hi:' + volume[volumeIndex][0].toString() + ' Lo:' + volume[volumeIndex][1].toString() );
        if((volume[volumeIndex][0]>-1) && (volume[volumeIndex][1]>-1)){
            var volVal = volume[volumeIndex][0]*256 + volume[volumeIndex][1];
            //this.log.info('setVolume() volumeIndex:' + volumeIndex.toString() +': ' + volVal.toString() );                           

	    arrOutputGain[volumeIndex] = volVal;	//Caching, damit der Wert ohne getState(...) griffbereit ist

            //----Normalisieren auf 0..100                 
            volVal /=13.9;
            //this.log.info('setVolume() NORMALIZED volumeIndex:' + volumeIndex.toString() +': ' + volVal.toString() );
            this.setStateAsync('outputgain_' + (volumeIndex+1).toString(), { val: volVal, ack: true });

            volume[volumeIndex][0] = -1;
            volume[volumeIndex][1] = -1;

            arrStateQuery_Output[volumeIndex] = true;
            this.checkQueryDone();
        }
    }

    //----Verarbeitung ankommender Daten. alles ist asynchron.
    parseMsg(msg){
        var arrResponse = this.toArray(msg);

        if (arrResponse[3] == 0x00 ){
            this.log.info('parseMsg() Response = CONNECTION' );
            connection = true;
            this.setState('info.connection', true, true);
	    this.setState('minorProblem', false, true);
            //this.queryMatrix();
        }else if (arrResponse[3] == 0x10 ){
            
            //----Routing
	    //if((arrResponse[4] == out0_in0_Hi) && (arrResponse[5] == out0_in0_Lo)){ this.setRoutingState(0, 0, (arrResponse[8]==0x1E)); }
            if((arrResponse[4] == out0_in0_Hi) && (arrResponse[5] == out0_in0_Lo)){ this.setRoutingStateValue(0, 0, (arrResponse[8])); }
            if((arrResponse[4] == out0_in1_Hi) && (arrResponse[5] == out0_in1_Lo)){ this.setRoutingStateValue(0, 1, (arrResponse[8])); }
            if((arrResponse[4] == out0_in2_Hi) && (arrResponse[5] == out0_in2_Lo)){ this.setRoutingStateValue(0, 2, (arrResponse[8])); }
            if((arrResponse[4] == out0_in3_Hi) && (arrResponse[5] == out0_in3_Lo)){ this.setRoutingStateValue(0, 3, (arrResponse[8])); }
            if((arrResponse[4] == out0_in4_Hi) && (arrResponse[5] == out0_in4_Lo)){ this.setRoutingStateValue(0, 4, (arrResponse[8])); }
            if((arrResponse[4] == out0_in5_Hi) && (arrResponse[5] == out0_in5_Lo)){ this.setRoutingStateValue(0, 5, (arrResponse[8])); }
            if((arrResponse[4] == out0_in6_Hi) && (arrResponse[5] == out0_in6_Lo)){ this.setRoutingStateValue(0, 6, (arrResponse[8])); }
            if((arrResponse[4] == out0_in7_Hi) && (arrResponse[5] == out0_in7_Lo)){ this.setRoutingStateValue(0, 7, (arrResponse[8])); }
            if((arrResponse[4] == out1_in0_Hi) && (arrResponse[5] == out1_in0_Lo)){ this.setRoutingStateValue(1, 0, (arrResponse[8])); }
            if((arrResponse[4] == out1_in1_Hi) && (arrResponse[5] == out1_in1_Lo)){ this.setRoutingStateValue(1, 1, (arrResponse[8])); }
            if((arrResponse[4] == out1_in2_Hi) && (arrResponse[5] == out1_in2_Lo)){ this.setRoutingStateValue(1, 2, (arrResponse[8])); }
            if((arrResponse[4] == out1_in3_Hi) && (arrResponse[5] == out1_in3_Lo)){ this.setRoutingStateValue(1, 3, (arrResponse[8])); }
            if((arrResponse[4] == out1_in4_Hi) && (arrResponse[5] == out1_in4_Lo)){ this.setRoutingStateValue(1, 4, (arrResponse[8])); }
            if((arrResponse[4] == out1_in5_Hi) && (arrResponse[5] == out1_in5_Lo)){ this.setRoutingStateValue(1, 5, (arrResponse[8])); }
            if((arrResponse[4] == out1_in6_Hi) && (arrResponse[5] == out1_in6_Lo)){ this.setRoutingStateValue(1, 6, (arrResponse[8])); }
            if((arrResponse[4] == out1_in7_Hi) && (arrResponse[5] == out1_in7_Lo)){ this.setRoutingStateValue(1, 7, (arrResponse[8])); }
            if((arrResponse[4] == out2_in0_Hi) && (arrResponse[5] == out2_in0_Lo)){ this.setRoutingStateValue(2, 0, (arrResponse[8])); }
            if((arrResponse[4] == out2_in1_Hi) && (arrResponse[5] == out2_in1_Lo)){ this.setRoutingStateValue(2, 1, (arrResponse[8])); }
            if((arrResponse[4] == out2_in2_Hi) && (arrResponse[5] == out2_in2_Lo)){ this.setRoutingStateValue(2, 2, (arrResponse[8])); }
            if((arrResponse[4] == out2_in3_Hi) && (arrResponse[5] == out2_in3_Lo)){ this.setRoutingStateValue(2, 3, (arrResponse[8])); }
            if((arrResponse[4] == out2_in4_Hi) && (arrResponse[5] == out2_in4_Lo)){ this.setRoutingStateValue(2, 4, (arrResponse[8])); }
            if((arrResponse[4] == out2_in5_Hi) && (arrResponse[5] == out2_in5_Lo)){ this.setRoutingStateValue(2, 5, (arrResponse[8])); }
            if((arrResponse[4] == out2_in6_Hi) && (arrResponse[5] == out2_in6_Lo)){ this.setRoutingStateValue(2, 6, (arrResponse[8])); }
            if((arrResponse[4] == out2_in7_Hi) && (arrResponse[5] == out2_in7_Lo)){ this.setRoutingStateValue(2, 7, (arrResponse[8])); }
            if((arrResponse[4] == out3_in0_Hi) && (arrResponse[5] == out3_in0_Lo)){ this.setRoutingStateValue(3, 0, (arrResponse[8])); }
            if((arrResponse[4] == out3_in1_Hi) && (arrResponse[5] == out3_in1_Lo)){ this.setRoutingStateValue(3, 1, (arrResponse[8])); }
            if((arrResponse[4] == out3_in2_Hi) && (arrResponse[5] == out3_in2_Lo)){ this.setRoutingStateValue(3, 2, (arrResponse[8])); }
            if((arrResponse[4] == out3_in3_Hi) && (arrResponse[5] == out3_in3_Lo)){ this.setRoutingStateValue(3, 3, (arrResponse[8])); }
            if((arrResponse[4] == out3_in4_Hi) && (arrResponse[5] == out3_in4_Lo)){ this.setRoutingStateValue(3, 4, (arrResponse[8])); }
            if((arrResponse[4] == out3_in5_Hi) && (arrResponse[5] == out3_in5_Lo)){ this.setRoutingStateValue(3, 5, (arrResponse[8])); }
            if((arrResponse[4] == out3_in6_Hi) && (arrResponse[5] == out3_in6_Lo)){ this.setRoutingStateValue(3, 6, (arrResponse[8])); }
            if((arrResponse[4] == out3_in7_Hi) && (arrResponse[5] == out3_in7_Lo)){ this.setRoutingStateValue(3, 7, (arrResponse[8])); }
            if((arrResponse[4] == out4_in0_Hi) && (arrResponse[5] == out4_in0_Lo)){ this.setRoutingStateValue(4, 0, (arrResponse[8])); }
            if((arrResponse[4] == out4_in1_Hi) && (arrResponse[5] == out4_in1_Lo)){ this.setRoutingStateValue(4, 1, (arrResponse[8])); }
            if((arrResponse[4] == out4_in2_Hi) && (arrResponse[5] == out4_in2_Lo)){ this.setRoutingStateValue(4, 2, (arrResponse[8])); }
            if((arrResponse[4] == out4_in3_Hi) && (arrResponse[5] == out4_in3_Lo)){ this.setRoutingStateValue(4, 3, (arrResponse[8])); }
            if((arrResponse[4] == out4_in4_Hi) && (arrResponse[5] == out4_in4_Lo)){ this.setRoutingStateValue(4, 4, (arrResponse[8])); }
            if((arrResponse[4] == out4_in5_Hi) && (arrResponse[5] == out4_in5_Lo)){ this.setRoutingStateValue(4, 5, (arrResponse[8])); }
            if((arrResponse[4] == out4_in6_Hi) && (arrResponse[5] == out4_in6_Lo)){ this.setRoutingStateValue(4, 6, (arrResponse[8])); }
            if((arrResponse[4] == out4_in7_Hi) && (arrResponse[5] == out4_in7_Lo)){ this.setRoutingStateValue(4, 7, (arrResponse[8])); }
            if((arrResponse[4] == out5_in0_Hi) && (arrResponse[5] == out5_in0_Lo)){ this.setRoutingStateValue(5, 0, (arrResponse[8])); }
            if((arrResponse[4] == out5_in1_Hi) && (arrResponse[5] == out5_in1_Lo)){ this.setRoutingStateValue(5, 1, (arrResponse[8])); }
            if((arrResponse[4] == out5_in2_Hi) && (arrResponse[5] == out5_in2_Lo)){ this.setRoutingStateValue(5, 2, (arrResponse[8])); }
            if((arrResponse[4] == out5_in3_Hi) && (arrResponse[5] == out5_in3_Lo)){ this.setRoutingStateValue(5, 3, (arrResponse[8])); }
            if((arrResponse[4] == out5_in4_Hi) && (arrResponse[5] == out5_in4_Lo)){ this.setRoutingStateValue(5, 4, (arrResponse[8])); }
            if((arrResponse[4] == out5_in5_Hi) && (arrResponse[5] == out5_in5_Lo)){ this.setRoutingStateValue(5, 5, (arrResponse[8])); }
            if((arrResponse[4] == out5_in6_Hi) && (arrResponse[5] == out5_in6_Lo)){ this.setRoutingStateValue(5, 6, (arrResponse[8])); }
            if((arrResponse[4] == out5_in7_Hi) && (arrResponse[5] == out5_in7_Lo)){ this.setRoutingStateValue(5, 7, (arrResponse[8])); }
            if((arrResponse[4] == out6_in0_Hi) && (arrResponse[5] == out6_in0_Lo)){ this.setRoutingStateValue(6, 0, (arrResponse[8])); }
            if((arrResponse[4] == out6_in1_Hi) && (arrResponse[5] == out6_in1_Lo)){ this.setRoutingStateValue(6, 1, (arrResponse[8])); }
            if((arrResponse[4] == out6_in2_Hi) && (arrResponse[5] == out6_in2_Lo)){ this.setRoutingStateValue(6, 2, (arrResponse[8])); }
            if((arrResponse[4] == out6_in3_Hi) && (arrResponse[5] == out6_in3_Lo)){ this.setRoutingStateValue(6, 3, (arrResponse[8])); }
            if((arrResponse[4] == out6_in4_Hi) && (arrResponse[5] == out6_in4_Lo)){ this.setRoutingStateValue(6, 4, (arrResponse[8])); }
            if((arrResponse[4] == out6_in5_Hi) && (arrResponse[5] == out6_in5_Lo)){ this.setRoutingStateValue(6, 5, (arrResponse[8])); }
            if((arrResponse[4] == out6_in6_Hi) && (arrResponse[5] == out6_in6_Lo)){ this.setRoutingStateValue(6, 6, (arrResponse[8])); }
            if((arrResponse[4] == out6_in7_Hi) && (arrResponse[5] == out6_in7_Lo)){ this.setRoutingStateValue(6, 7, (arrResponse[8])); }
            if((arrResponse[4] == out7_in0_Hi) && (arrResponse[5] == out7_in0_Lo)){ this.setRoutingStateValue(7, 0, (arrResponse[8])); }
            if((arrResponse[4] == out7_in1_Hi) && (arrResponse[5] == out7_in1_Lo)){ this.setRoutingStateValue(7, 1, (arrResponse[8])); }
            if((arrResponse[4] == out7_in2_Hi) && (arrResponse[5] == out7_in2_Lo)){ this.setRoutingStateValue(7, 2, (arrResponse[8])); }
            if((arrResponse[4] == out7_in3_Hi) && (arrResponse[5] == out7_in3_Lo)){ this.setRoutingStateValue(7, 3, (arrResponse[8])); }
            if((arrResponse[4] == out7_in4_Hi) && (arrResponse[5] == out7_in4_Lo)){ this.setRoutingStateValue(7, 4, (arrResponse[8])); }
            if((arrResponse[4] == out7_in5_Hi) && (arrResponse[5] == out7_in5_Lo)){ this.setRoutingStateValue(7, 5, (arrResponse[8])); }
            if((arrResponse[4] == out7_in6_Hi) && (arrResponse[5] == out7_in6_Lo)){ this.setRoutingStateValue(7, 6, (arrResponse[8])); }
            if((arrResponse[4] == out7_in7_Hi) && (arrResponse[5] == out7_in7_Lo)){ this.setRoutingStateValue(7, 7, (arrResponse[8])); }

            //----Input Gain
            if((arrResponse[4] == inGain_0_HiVal_Hi) && (arrResponse[5] == inGain_0_HiVal_Lo)){ inGain[0][0] = arrResponse[8]; this.setInputGain(0)}
            if((arrResponse[4] == inGain_0_LoVal_Hi) && (arrResponse[5] == inGain_0_LoVal_Lo)){ inGain[0][1] = arrResponse[8]; this.setInputGain(0)}
            if((arrResponse[4] == inGain_1_HiVal_Hi) && (arrResponse[5] == inGain_1_HiVal_Lo)){ inGain[1][0] = arrResponse[8]; this.setInputGain(1)}
            if((arrResponse[4] == inGain_1_LoVal_Hi) && (arrResponse[5] == inGain_1_LoVal_Lo)){ inGain[1][1] = arrResponse[8]; this.setInputGain(1)}                                                  
            if((arrResponse[4] == inGain_2_HiVal_Hi) && (arrResponse[5] == inGain_2_HiVal_Lo)){ inGain[2][0] = arrResponse[8]; this.setInputGain(2)}
            if((arrResponse[4] == inGain_2_LoVal_Hi) && (arrResponse[5] == inGain_2_LoVal_Lo)){ inGain[2][1] = arrResponse[8]; this.setInputGain(2)}
            if((arrResponse[4] == inGain_3_HiVal_Hi) && (arrResponse[5] == inGain_3_HiVal_Lo)){ inGain[3][0] = arrResponse[8]; this.setInputGain(3)}
            if((arrResponse[4] == inGain_3_LoVal_Hi) && (arrResponse[5] == inGain_3_LoVal_Lo)){ inGain[3][1] = arrResponse[8]; this.setInputGain(3)}
            if((arrResponse[4] == inGain_4_HiVal_Hi) && (arrResponse[5] == inGain_4_HiVal_Lo)){ inGain[4][0] = arrResponse[8]; this.setInputGain(4)}
            if((arrResponse[4] == inGain_4_LoVal_Hi) && (arrResponse[5] == inGain_4_LoVal_Lo)){ inGain[4][1] = arrResponse[8]; this.setInputGain(4)}
            if((arrResponse[4] == inGain_5_HiVal_Hi) && (arrResponse[5] == inGain_5_HiVal_Lo)){ inGain[5][0] = arrResponse[8]; this.setInputGain(5)}
            if((arrResponse[4] == inGain_5_LoVal_Hi) && (arrResponse[5] == inGain_5_LoVal_Lo)){ inGain[5][1] = arrResponse[8]; this.setInputGain(5)}
            if((arrResponse[4] == inGain_6_HiVal_Hi) && (arrResponse[5] == inGain_6_HiVal_Lo)){ inGain[6][0] = arrResponse[8]; this.setInputGain(6)}
            if((arrResponse[4] == inGain_6_LoVal_Hi) && (arrResponse[5] == inGain_6_LoVal_Lo)){ inGain[6][1] = arrResponse[8]; this.setInputGain(6)}
            if((arrResponse[4] == inGain_7_HiVal_Hi) && (arrResponse[5] == inGain_7_HiVal_Lo)){ inGain[7][0] = arrResponse[8]; this.setInputGain(7)}
            if((arrResponse[4] == inGain_7_LoVal_Hi) && (arrResponse[5] == inGain_7_LoVal_Lo)){ inGain[7][1] = arrResponse[8]; this.setInputGain(7)}

            //----Volume VOR Routing
            if((arrResponse[4] == vol_0_HiVal_Hi) && (arrResponse[5] == vol_0_HiVal_Lo)){ volume[0][0] = arrResponse[8]; this.setVolume(0)}
            if((arrResponse[4] == vol_0_LoVal_Hi) && (arrResponse[5] == vol_0_LoVal_Lo)){ volume[0][1] = arrResponse[8]; this.setVolume(0)}
            if((arrResponse[4] == vol_1_HiVal_Hi) && (arrResponse[5] == vol_1_HiVal_Lo)){ volume[1][0] = arrResponse[8]; this.setVolume(1)}
            if((arrResponse[4] == vol_1_LoVal_Hi) && (arrResponse[5] == vol_1_LoVal_Lo)){ volume[1][1] = arrResponse[8]; this.setVolume(1)}
            if((arrResponse[4] == vol_2_HiVal_Hi) && (arrResponse[5] == vol_2_HiVal_Lo)){ volume[2][0] = arrResponse[8]; this.setVolume(2)}
            if((arrResponse[4] == vol_2_LoVal_Hi) && (arrResponse[5] == vol_2_LoVal_Lo)){ volume[2][1] = arrResponse[8]; this.setVolume(2)}
            if((arrResponse[4] == vol_3_HiVal_Hi) && (arrResponse[5] == vol_3_HiVal_Lo)){ volume[3][0] = arrResponse[8]; this.setVolume(3)}
            if((arrResponse[4] == vol_3_LoVal_Hi) && (arrResponse[5] == vol_3_LoVal_Lo)){ volume[3][1] = arrResponse[8]; this.setVolume(3)}
            if((arrResponse[4] == vol_4_HiVal_Hi) && (arrResponse[5] == vol_4_HiVal_Lo)){ volume[4][0] = arrResponse[8]; this.setVolume(4)}
            if((arrResponse[4] == vol_4_LoVal_Hi) && (arrResponse[5] == vol_4_LoVal_Lo)){ volume[4][1] = arrResponse[8]; this.setVolume(4)}
            if((arrResponse[4] == vol_5_HiVal_Hi) && (arrResponse[5] == vol_5_HiVal_Lo)){ volume[5][0] = arrResponse[8]; this.setVolume(5)}
            if((arrResponse[4] == vol_5_LoVal_Hi) && (arrResponse[5] == vol_5_LoVal_Lo)){ volume[5][1] = arrResponse[8]; this.setVolume(5)}
            if((arrResponse[4] == vol_6_HiVal_Hi) && (arrResponse[5] == vol_6_HiVal_Lo)){ volume[6][0] = arrResponse[8]; this.setVolume(6)}
            if((arrResponse[4] == vol_6_LoVal_Hi) && (arrResponse[5] == vol_6_LoVal_Lo)){ volume[6][1] = arrResponse[8]; this.setVolume(6)}
            if((arrResponse[4] == vol_7_HiVal_Hi) && (arrResponse[5] == vol_7_HiVal_Lo)){ volume[7][0] = arrResponse[8]; this.setVolume(7)}
            if((arrResponse[4] == vol_7_LoVal_Hi) && (arrResponse[5] == vol_7_LoVal_Lo)){ volume[7][1] = arrResponse[8]; this.setVolume(7)}

	}else if (arrResponse[3] == 0x10 ){
	    this.log.debug('AudioMatrix: parseMsg() Response= WriteMemory:' + msg );

        } else {
            this.log.debug('AudioMatrix: parseMsg() Response unhandled:' + msg );
        }

        bWaitingForResponse = false;
    }


    //----Ein State wurde veraendert
    matrixchanged(id, val, ack){

        if (connection && val && !val.ack) {
            //this.log.info('matrixChanged: tabu=TRUE' );
            //tabu = true;
        }
        if(ack==false){	//----Aenderung ueber die GUI
            if(id.toString().includes('.outputgain_')){
                //this.log.info('matrixChanged: outputgain changed. ID:' + id.toString() );
                var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1));
                //this.log.info('matrixChanged: outputgain changed. ID:' + channelID.toString() );
		val*=13.9;
                var loByte = val & 0xFF;
                var hiByte = (val >> 8) & 0xFF;


                channelID-=1;
		arrOutputGain[channelID] =val;	//Caching, damit der Wert ohne getState(...) griffbereit ist

                channelID+=8;  //
                cmdGain[4] = channelID;

                
                cmdGain[7] = loByte;
                cmdGain[11] = hiByte;


		arrCMD = arrCMD.concat(new Buffer(cmdGain));
                this.processCMD();

            }

            if(id.toString().includes('.inputgain')){
                //this.log.info('matrixChanged: inputgain changed. ID:' + id.toString());
                var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1));
                //this.log.info('matrixChanged: inputgain changed. ID:' + channelID.toString() );
		val*=13.9;
                var loByte = val & 0xFF;
                var hiByte = (val >> 8) & 0xFF;

                channelID-=1;   //
		arrInputGain[channelID] = val;	//Caching, damit der Wert ohne getState(...) griffbereit ist
                cmdGain[4] = channelID;

                

                cmdGain[7] = loByte;
                cmdGain[11] = hiByte;

                //arrCMD.push(cmdGain);
		arrCMD = arrCMD.concat(new Buffer(cmdGain));
                this.processCMD();
            }


            if(id.toString().includes('.outputroutestate_')){
                var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1))-1;
                
                var iAusgang = channelID % 8;
                var iEingang = (channelID-iAusgang)/8;

                cmdRoute[4] = iAusgang + 8;
                cmdRoute[10] = iEingang;
                if(val==true){
                    this.log.info('AudioMatrix: matrixChanged: Eingang ' + iEingang.toString() + ' Ausgang ' + iAusgang.toString() + ' AN' );
                    //cmdRoute[11] = 30; //----Voll AN
		    //Es gibt eine gemeinsame Volume-Regelung fuer alle Inputs eines Ausgangs. Wir schalten eben NICHT auf FULL ON, sondern gleichen
		    //Die Giuete des Routing-Knotens dem eingestellten Wert des Ausgangs an. 
		    cmdRoute[11]=arrPostRoutingVolume[iAusgang];

		    arrOutputRoutingState[iEingang*8+iAusgang] = true;
                }else{
                    this.log.info('AudioMatrix: matrixChanged: Eingang ' + iEingang.toString() + ' Ausgang ' + iAusgang.toString() + ' AUS');
                    //cmdRoute[11] = 128; //----Voll AUS
		    //
		    cmdRoute[11]=arrPostRoutingVolume[iAusgang] + 128;
		    arrOutputRoutingState[iEingang*8+iAusgang] = false;
		    //arrOutputRoutingState[iAusgang] = false;
                }

               	//arrCMD.push(cmdRoute);
		arrCMD = arrCMD.concat(new Buffer(cmdRoute));
                this.processCMD();
            }

	    //----"Ausgang Theke lauter"
	    if(id.toString().includes('.outputgainpostrouting_')){

                this.log.info('matrixChanged: outputgainpostrouting changed. ID:' + id.toString() );
		var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1))-1;
                
                var iAusgang = channelID % 8;
                var iEingang = (channelID-iAusgang)/8;

                cmdRoute[4] = iAusgang + 8;
                //cmdRoute[10] = iEingang;

		val = parseInt(val*30/100);	//Fader: 0..100, intern: 0..30
		arrPostRoutingVolume[iAusgang] = val;
		this.log.info('matrixChanged: outputgainpostrouting changed. arrPostRoutingVolume[' + iAusgang.toString() + ']=' + val.toString() );
		var tmpEingang = 0;
		for(var i=1; i<65; i+=8){
		    this.log.info('matrixChanged: Routing laut arrOutputRoutingState[' + (iAusgang+i-1) + ']:' + arrOutputRoutingState[(iAusgang+i-1)].toString() ) ;
		    cmdRoute[10] = tmpEingang;
		    tmpEingang++;

		    if(arrOutputRoutingState[(iAusgang+i-1)]==true){
			cmdRoute[11] = val;
		    }else{
			cmdRoute[11] = val+128;
		    }
		    arrCMD = arrCMD.concat(new Buffer(cmdRoute));
		}	
               this.processCMD();
            }

	    if(id.toString().includes('.savetopreset')){
		//Wir holen alles, was wir in arrQuery[] haben und schreiben Byte[3] um. 
		//----Damit speichern wir alles, was wir abfragen
		this.log.info('matrixChanged: saveToPreset()');
/*
		arrQuery.forEach(function(item, index, array) {                             
		    var tmpCMD = new Buffer(item);
		    tmpCMD[3] = 0x11;
		    parentThis.log.info('AudioMatrix: saveToPreset(). CMD:' + parentThis.toHexString(tmpCMD));
		    //arrCMD = arrCMD.concat(new Buffer(cmdGain));
		    //arrCMD.push(item);
		});
*/


		//var loByte = arrInputGain[0] & 0xFF;
                //var hiByte = ((arrInputGain[0] >> 8) & 0xFF);
		//----InGain
		/*

		parentThis.log.info('AudioMatrix: saveToPreset(). Inputgain[...] =' + arrInputGain[0].toString() );
		parentThis.log.info('AudioMatrix: saveToPreset(). Inputgain[...] =' + arrInputGain[1].toString() );
		parentThis.log.info('AudioMatrix: saveToPreset(). Inputgain[...] =' + arrInputGain[2].toString() );
		parentThis.log.info('AudioMatrix: saveToPreset(). Inputgain[...] =' + arrInputGain[3].toString() );
		parentThis.log.info('AudioMatrix: saveToPreset(). Inputgain[...] =' + arrInputGain[4].toString() );
		parentThis.log.info('AudioMatrix: saveToPreset(). Inputgain[...] =' + arrInputGain[5].toString() );
		parentThis.log.info('AudioMatrix: saveToPreset(). Inputgain[...] =' + arrInputGain[6].toString() );
		parentThis.log.info('AudioMatrix: saveToPreset(). Inputgain[...] =' + arrInputGain[7].toString() );
		*/
		var tmpCMD;
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_0_HiVal_Hi, inGain_0_HiVal_Lo, 0x00, 0x00, ((arrInputGain[0] >> 8) & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_0_LoVal_Hi, inGain_0_LoVal_Lo, 0x00, 0x00, (arrInputGain[0] & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));		
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_1_HiVal_Hi, inGain_1_HiVal_Lo, 0x00, 0x00, ((arrInputGain[1] >> 8) & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_1_LoVal_Hi, inGain_1_LoVal_Lo, 0x00, 0x00, (arrInputGain[1] & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_2_HiVal_Hi, inGain_2_HiVal_Lo, 0x00, 0x00, ((arrInputGain[2] >> 8) & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_2_LoVal_Hi, inGain_2_LoVal_Lo, 0x00, 0x00, (arrInputGain[2] & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_3_HiVal_Hi, inGain_3_HiVal_Lo, 0x00, 0x00, ((arrInputGain[3] >> 8) & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_3_LoVal_Hi, inGain_3_LoVal_Lo, 0x00, 0x00, (arrInputGain[3] & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_4_HiVal_Hi, inGain_4_HiVal_Lo, 0x00, 0x00, ((arrInputGain[4] >> 8) & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_4_LoVal_Hi, inGain_4_LoVal_Lo, 0x00, 0x00, (arrInputGain[4] & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_5_HiVal_Hi, inGain_5_HiVal_Lo, 0x00, 0x00, ((arrInputGain[5] >> 8) & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_5_LoVal_Hi, inGain_5_LoVal_Lo, 0x00, 0x00, (arrInputGain[5] & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_6_HiVal_Hi, inGain_6_HiVal_Lo, 0x00, 0x00, ((arrInputGain[6] >> 8) & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_6_LoVal_Hi, inGain_6_LoVal_Lo, 0x00, 0x00, (arrInputGain[6] & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_7_HiVal_Hi, inGain_7_HiVal_Lo, 0x00, 0x00, ((arrInputGain[7] >> 8) & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		tmpCMD = new Buffer([0xf0, firmware, idDevice, 0x11, inGain_7_LoVal_Hi, inGain_7_LoVal_Lo, 0x00, 0x00, (arrInputGain[7] & 0xFF), 0x00, 0x00, 0x00, 0xf7]);
		arrCMD = arrCMD.concat(new Buffer(tmpCMD));
		
		this.processCMD();
	    }


        }//----ack==FALSE                         

    }

    /**
    * Is called when databases are connected and adapter received configuration.
    */
    async onReady() {
        // Initialize your adapter here

        // Reset the connection indicator during startup
        //this.setState('info.connection_net', false, true);
        //this.setState('info.connection_hardware', false, true);
        this.setState('info.connection', false, true);

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        //this.log.info('config option1: ' + this.config.option1);
        //this.log.info('config option2: ' + this.config.option2);
        this.log.info('AudioMatrix: config Host: ' + this.config.host);
        this.log.info('AudioMatrix: config Port: ' + this.config.port);
        this.log.info('AudioMatrix: config Firmware: ' + this.config.firmware);

        /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        */
        /*
        await this.setObjectAsync('testVariable', {
        type: 'state',
        common: {
        name: 'testVariable',
        type: 'boolean',
        role: 'indicator',
        read: true,
        write: true,
        },
        native: {},
        });
        */

	

        //----Anlegen der Eingaenge
        for (var i = 1; i < 9; i++) {
            //arrStateQuery_Input.push(false);
            await this.setObjectAsync('inputgain_' + i.toString(), {
                type: 'state',
                common: {
                name: 'Input ' + i.toString() + " Gain",
                type: 'number',
                role: 'level.volume',
                read: true,
                write: true,
                min: 0,
                max: 100,
                desc: 'Eingang ' + i.toString()
            },
            native: {},
            });
        }

        //----Anlegen der Ausgaenge
        for (var i = 1; i < 9; i++) {
            //arrStateQuery_Output.push(false);
            await this.setObjectAsync('outputgain_' + i.toString(), {
                type: 'state',
                common: {
                name: 'Output ' + i.toString() + " Gain",
                type: 'number',
                role: 'level.volume',
                read: true,
                write: true,
		desc: 'Ausgang VOR Routing' + i.toString(),
                min: 0,
                max: 100
            },
            native: {},
            });
        }

	//----Veraendert die Guete der Routing-Knoten fuer den Ausgang
        for (var i = 1; i < 9; i++) {
            await this.setObjectAsync('outputgainpostrouting_' + i.toString(), {
                type: 'state',
                common: {
                name: 'Output post Routing ' + i.toString() + " Gain",
                type: 'number',
                role: 'level.volume',
                read: true,
                write: true,
		desc: 'Ausgang NACH Routing' + i.toString(),
                min: 0,
                max: 100
            },
            native: {},
            });
        }


        //----Routing via Buttons; 0-indiziert, aber Anzeige beginnt bei '1'
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                //arrStateQuery_Routing.push(false);
                //await this.setObjectAsync('outputroutestate_' + i.toString() + '-' + j.toString(), {
                await this.setObjectAsync('outputroutestate_' + ((i*8 + j)+1).toString(), {
                    type: 'state',
                    common: {
                        name: 'outputrouting',
                        type: 'boolean',
                        role: 'indicator',
                        read: true,
                        write: true,
                    },
                    native: {},
                });
            }
        }

/*
        //----Preset
        await this.setObjectAsync('preset', {
            type: 'state',
            common: {
                name: 'Preset Selection',
                type: 'number',
                role: 'level',
                read: true,
                write: true,
                min: 1,
                max: 6
            },
            native: {},
        });
*/

        //----Laenge von arrCMD; der Command-Queue
        await this.setObjectAsync('queuelength', {
            type: 'state',
            common: {
                name: 'Length of Command-Queue',
                type: 'number',
                role: 'level',
                read: true,
                write: false
                //min: 1,
                //max: 6
            },
            native: {},
        });

	await this.setObjectAsync('queryState', {
		type: 'state',
		common: {
			name: 'True: Hardware is being queried after Connection. False: Done',
			type: 'boolean',
			role: 'indicator',
			read: true,
			write: false,
		},
		native: {},
        });

	await this.setObjectAsync('minorProblem', {
		type: 'state',
		common: {
			name: 'True: Hardware did not resond instantly. Reconnect will be triggered if happens 3 times in a row.',
			type: 'boolean',
			role: 'indicator',
			read: true,
			write: false,
		},
		native: {},
        });

	await this.setObjectAsync('savetopreset', {
            type: 'state',
            common: {
                name: 'saveToPreset',
		def:  false,
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: true,
            },
            native: {},
        });
	 

        // in this template all states changes inside the adapters namespace are subscribed
        this.subscribeStates('*');

        /*
        setState examples
        you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)
        // await this.setStateAsync('testVariable', true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        // await this.setStateAsync('testVariable', { val: true, ack: true });

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        // await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

        // examples for the checkPassword/checkGroup functions
        // let result = await this.checkPasswordAsync('admin', 'iobroker');
        // this.log.info('check user admin pw ioboker: ' + result);

        // result = await this.checkGroupAsync('admin', 'admin');
        // this.log.info('check group user admin group admin: ' + result);

        //----
        this.initmatrix();
    }

    /**
    * Is called when adapter shuts down - callback has to be called under any circumstances!
    * @param {() => void} callback
    */
    onUnload(callback) {
        try {
            this.log.info('AudioMatrix: cleaned everything up...');
                callback();
            } catch (e) {
                callback();
        }
    }

    /**
    * Is called if a subscribed object changes
    * @param {string} id
    * @param {ioBroker.Object | null | undefined} obj
    */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`AudioMatrix: object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.info(`AudioMatrix: object ${id} deleted`);
        }
    }

    /**
    * Is called if a subscribed state changes
    * @param {string} id
    * @param {ioBroker.State | null | undefined} state
    */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            if(state.ack==false){
                //----Aenderung per GUI
                this.log.info(`AudioMatrix: state ${id} changed: ${state.val} (ack = ${state.ack})`);
            }
            this.matrixchanged(id, state.val, state.ack);

        } else {
            // The state was deleted
            this.log.info(`AudioMatrix: state ${id} deleted`);
        }
    }

    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    // if (typeof obj === "object" && obj.message) {
    // if (obj.command === "send") {
    // // e.g. send email or pushover or whatever
    // this.log.info("send command");
    // // Send response in callback if required
    // if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
    // }
    // }
    // }

}

if (module.parent) {
    // Export the constructor in compact mode
    /**
    * @param {Partial<ioBroker.AdapterOptions>} [options={}]
    */
    module.exports = (options) => new Audiomatrix880(options);
} else {
    // otherwise start the instance directly
    new Audiomatrix880();
}
