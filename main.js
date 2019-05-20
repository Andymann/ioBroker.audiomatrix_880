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
var connection = false;		//----Connection in SUMME
var connection_net = false;	//----Connection zum Ethernet-Seriall Adapter
var connection_hardware = false;//----Connection des Eth-Seriell-Adapters mit der angeschlossenen Hardware
var tabu = false;
var polling_time = 10000;	//In dem Intervall wird die angeschlossen Hardware angefragt
var response_wait_time = 5000;	//Solange warten wir nach einem Polling auf eine grundsaetzliche Antwort der Hardware
var query = null;
var in_msg = '';
//var in_msg_raw = '';

var parentThis;

//----https://github.com/ioBroker/ioBroker/wiki/Adapter-Development-Documentation
//----https://github.com/ioBroker/ioBroker/blob/master/doc/SCHEMA.md
//----https://github.com/ioBroker/ioBroker/blob/master/doc/STATE_ROLES.md  => level.volume
var idDevice = 0x01;
var firmware = 0x45;	//----Default

//----2. Byte: Firmware Version. Initial auf v1.4 == 0x45
var cmdConnect;// =	new Buffer([0xf0, 0x45, idDevice, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdDisconnect;// =	new Buffer([0xf0, 0x45, idDevice, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdGain;// =		new Buffer([0xf0, 0x45, idDevice, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdRoute;// =		new Buffer([0xf0, 0x45, idDevice, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdPreset;// =		new Buffer([0xf0, 0x45, idDevice, 0x1B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdReadmemory;// = 	new Buffer([0xf0, 0x45, idDevice, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);


var bWaitingForResponse = false;


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


//----Caching der Gain-Werte: Hi, Lo

var inGain_0 = [-1, -1];
var inGain_1 = [-1, -1];
var inGain_2 = [-1, -1];
var inGain_3 = [-1, -1];
var inGain_4 = [-1, -1];
var inGain_5 = [-1, -1];
var inGain_6 = [-1, -1];
var inGain_7 = [-1, -1];

//----https://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
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

//----Routing Memory Location
var out0_in0_Hi = 0x00; 
var out0_in0_Lo = 0x48;
var out0_in1_Hi = 0x00; 
var out0_in1_Lo = 0x49;
var out0_in2_Hi = 0x00; 
var out0_in2_Lo = 0x4A;
var out0_in3_Hi = 0x00; 
var out0_in3_Lo = 0x4B;

var out1_in0_Hi = 0x00; 
var out1_in0_Lo = 0x7C;
var out1_in1_Hi = 0x00; 
var out1_in1_Lo = 0x7D;
var out1_in2_Hi = 0x00; 
var out1_in2_Lo = 0x7E;
var out1_in3_Hi = 0x00; 
var out1_in3_Lo = 0x7F

var out2_in0_Hi = 0x00; 
var out2_in0_Lo = 0xB0;
var out2_in1_Hi = 0x00; 
var out2_in1_Lo = 0xB1;
var out2_in2_Hi = 0x00; 
var out2_in2_Lo = 0xB2;
var out2_in3_Hi = 0x00; 
var out2_in3_Lo = 0xB3;

var out3_in0_Hi = 0x00; 
var out3_in0_Lo = 0xE4;
var out3_in1_Hi = 0x00; 
var out3_in1_Lo = 0xE5;
var out3_in2_Hi = 0x00; 
var out3_in2_Lo = 0xE6;
var out3_in3_Hi = 0x00; 
var out3_in3_Lo = 0xE7;

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

	setConnState(pConn_net, pConn_hw){
		this.connection_net = pConn_net;
		this.connection_hardware = pConn_hw;
		this.connection = connection_net && connection_hardware;
		
		this.setState('info.connection_net', connection_net, true);
		this.setState('info.connection_hardware', connection_hardware, true);
		this.setState('info.connection', connection, true);

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

	reconfigureCMD(pFirmware){
		cmdConnect =	new Buffer([0xf0, pFirmware, idDevice, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
		cmdDisconnect =	new Buffer([0xf0, pFirmware, idDevice, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
		cmdGain =	new Buffer([0xf0, pFirmware, idDevice, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
		cmdRoute =	new Buffer([0xf0, pFirmware, idDevice, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
		cmdPreset =	new Buffer([0xf0, pFirmware, idDevice, 0x1B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
		cmdReadmemory =	new Buffer([0xf0, pFirmware, idDevice, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
	}
	


	reconnect(){
		this.log.info('reconnectMatrix()');
		clearInterval(query);
		clearTimeout(recnt);
		matrix.destroy();
		
		this.log.info('Reconnect after 15 sec...');
		//connection_net = false;
		//connection_hardware = false;
		//connection = connection_net && connection_hardware;
		//this.setState('info.connection', connection, true);
		this.setConnState(false, false);
		recnt = setTimeout(function() {
			parentThis.initmatrix();
		}, 15000);
	}


	connectmatrix(cb){
		//this.log.info('connectMatrix().');
 		var host = this.config.host;
		var port = this.config.port;
		firmware = this.config.firmware;	//----Einlesen via config
		var tmpFirmwareName;
		if(firmware=='v14'){
			this.reconfigureCMD(0x45);
			tmpFirmwareName = 'v1.4';
		}else if(firmware=='v16'){
			this.reconfigureCMD(0x46);
			tmpFirmwareName = 'v1.6';
		}
		this.log.info('AudioMatrix connecting to: ' + this.config.host + ':' + this.config.port + ' Firmware Version:' + tmpFirmwareName);

		matrix = new net.Socket();
		matrix.setTimeout(polling_time*2);
		matrix.setKeepAlive(true,5000);
		matrix.connect(this.config.port, this.config.host, function() {
			clearInterval(query);
			query = setInterval(function() {
			    if(!tabu){	//----Damit nicht gepolled wird, wenn gerade etwas anderes stattfindet.
				parentThis.bWaitingForResponse=true;
				if(connection==false){
					parentThis.log.info('connectMatrix().connection==false, sending CMDCONNECT:' + parentThis.toHexString(cmdConnect));
					//this.log.info('AudioMatrix send:' + this.toHexString(cmd) + ' Timeout:' + iTimeout.toString() );
					parentThis.send(cmdConnect, 1000);
					setConnState(true, false);
				}else{
					parentThis.log.info('connectMatrix().connection==true, idle, querying Matrix');
					parentThis.queryMatrix();
					setConnState(true, true);
					//if(bWaitingForResponse==true){
					//	parentThis.log.info('connectMatrix().connection==true, bWaitingForResponse==TRUE, aber Timeout');
					//	bWaitingForResponse = false;
					//}
				}
				
				//----Nach der Zeit sollt irgendetwas angekommen sein, ansonsten gibt es ein Kommunikatinsproblem mit der Hardware
				setTimeout(function(){
					//parentThis.log.info('connectMatrix()Nach dem Timeout. bWaitingForResponse=' + parentThis.bWaitingForResponse);
					if(parentThis.bWaitingForResponse){
						//----Wir warten nach 5000ms noch auf Antwort. Das ist nicht gut
						parentThis.log.info('connectMatrix() Keine valide Antwort der Hardware nach ' + response_wait_time + ' Milisekunden.');
						parentThis.log.info('connectMatrix() in_msg:' + in_msg);
						parentThis.log.info( 'inmsg-chunk: -' + in_msg.toLowerCase().substring(24,26) + '-' );
						parentThis.reconnect();
					}
				}, response_wait_time);
			    }else{
					parentThis.log.info('connectMatrix().In Interval aber tabu==TRUE');
				}
			}, polling_time);
			//parentThis.log.info('connectMatrix().cNACH dem Aufruf von SetIntervall()');
			if(cb){cb();}
	
		});

			
		matrix.on('data', function(chunk) {
			in_msg += parentThis.toHexString(chunk);
			if(in_msg.toLowerCase().startsWith('f0')){
				//if((in_msg.length == 26) && (in_msg.toLowerCase().endsWith('f7'))){
				if((in_msg.length >= 26) && (in_msg.toLowerCase().substring(24,26)=='f7')){
					
					parentThis.bWaitingForResponse = false;
					parentThis.parseMsg(in_msg);
					in_msg = '';
				}
			}else{
				//----Irgendwie vergneisgnaddelt
				parentThis.log.info('matrix.on data vergniesgnaddelung angefangen: in_msg starts with:' + in_msg);
				in_msg = '';
			}

			if(in_msg.length > 27){
				//----Just in case
				in_msg = '';
			}
		});

		matrix.on('timeout', function(e) {
			//if (e.code == "ENOTFOUND" || e.code == "ECONNREFUSED" || e.code == "ETIMEDOUT") {
			//	matrix.destroy();
			//}
			parentThis.log.error('AudioMatrix TIMEOUT');
			//parentThis.connection=false;
			parentThis.setConnState(false, true);
			//parentThis.reconnect();
		});

		matrix.on('error', function(e) {
			if (e.code == "ENOTFOUND" || e.code == "ECONNREFUSED" || e.code == "ETIMEDOUT") {
				matrix.destroy();
			}
			parentThis.log.error(e);
		});

		matrix.on('close', function(e) {
			if(connection){
				parentThis.log.error('AudioMatrix closed');
			}
			parentThis.reconnect();
		});

		matrix.on('disconnect', function(e) {
			parentThis.log.error('AudioMatrix disconnected');
			parentThis.reconnect();
			
		});

		matrix.on('end', function(e) {
			parentThis.log.error('AudioMatrix ended');
			parentThis.setConnState(false, true);			
		});
	}


	setRoutingState(outIndex, inIndex, onoff){
		//this.log.info('setRoutingState() Out:' + outIndex.toString() + ' In:' + inIndex.toString() + ' Val:' + onoff.toString() );
		//this.log.info('setRoutingState() outputroutestate_' + (inIndex*8 + outIndex).toString());
		this.setStateAsync('outputroutestate_' + (inIndex*8 + outIndex+1).toString(), { val: onoff, ack: true });
	}

	setInputGain(gainIndex){
		//this.log.info('setInputGain() gainIndex:' + gainIndex.toString() + ' Hi:' + inGain[gainIndex][0].toString() + ' Lo:' + inGain[gainIndex][1].toString() );
		if((inGain[gainIndex][0]>-1) && (inGain[gainIndex][1]>-1)){
			//this.log.info('setInputGain() gainIndex:' + gainIndex.toString() + ' Hi:' + inGain[gainIndex][0].toString() + ' Lo:' + inGain[gainIndex][1].toString() );
			var gainVal = inGain[gainIndex][0]*256 + inGain[gainIndex][1];
			//this.log.info('setInputGain() gainValue' + gainIndex.toString() + ':' + gainVal.toString() );

			//----Normalisieren auf 0..100		
			gainVal /=13.9;
			//this.log.info('setInputGain() NORMALIZED gainValue' + gainIndex.toString() + ':' + gainVal.toString() );
			this.setStateAsync('inputgain_' + (gainIndex+1).toString(), { val: gainVal, ack: true });
			inGain[gainIndex][0] = -1;
			inGain[gainIndex][1] = -1;	
		}
	}

	setVolume(volumeIndex){
		//this.log.info('setVolume() volumeIndex:' + volumeIndex.toString() + ' Hi:' + volume[volumeIndex][0].toString() + ' Lo:' + volume[volumeIndex][1].toString() );
		if((volume[volumeIndex][0]>-1) && (volume[volumeIndex][1]>-1)){
			var volVal = volume[volumeIndex][0]*256 + volume[volumeIndex][1];
			//this.log.info('setVolume() volumeIndex:' + volumeIndex.toString() +': ' + volVal.toString() );		
			
			//----Normalisieren auf 0..100		
			volVal /=13.9;
			//this.log.info('setVolume() NORMALIZED volumeIndex:' + volumeIndex.toString() +': ' + volVal.toString() );
			this.setStateAsync('outputgain_' + (volumeIndex+1).toString(), { val: volVal, ack: true });

			volume[volumeIndex][0] = -1;
			volume[volumeIndex][1] = -1;	
		}
	}

	//----Verarbeitung ankommender Daten. alles ist asynchron.
	parseMsg(msg){
		this.setConnState(true, true);
		tabu = true;
		//this.log.info('parseMsg():' + msg);
		var arrResponse = this.toArray(msg);
		//this.log.info('parseMsg() LEN:' + arrResponse.length.toString() );

		if (arrResponse[3] == 0x00 ){
			this.log.info('parseMsg() Response = CONNECTION' );
			
			this.setState('info.connection', true, true);
			this.queryMatrix();
		}else if (arrResponse[3] == 0x10 ){
			//this.log.info('parseMsg() Response = ReadMemory' );
			//----Routing
			if((arrResponse[4] == out0_in0_Hi) && (arrResponse[5] == out0_in0_Lo)){ this.setRoutingState(0, 0, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out0_in1_Hi) && (arrResponse[5] == out0_in1_Lo)){ this.setRoutingState(0, 1, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out0_in2_Hi) && (arrResponse[5] == out0_in2_Lo)){ this.setRoutingState(0, 2, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out0_in3_Hi) && (arrResponse[5] == out0_in3_Lo)){ this.setRoutingState(0, 3, (arrResponse[8]==0x1E)); }

			if((arrResponse[4] == out1_in0_Hi) && (arrResponse[5] == out1_in0_Lo)){ this.setRoutingState(1, 0, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out1_in1_Hi) && (arrResponse[5] == out1_in1_Lo)){ this.setRoutingState(1, 1, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out1_in2_Hi) && (arrResponse[5] == out1_in2_Lo)){ this.setRoutingState(1, 2, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out1_in3_Hi) && (arrResponse[5] == out1_in3_Lo)){ this.setRoutingState(1, 3, (arrResponse[8]==0x1E)); }

			if((arrResponse[4] == out2_in0_Hi) && (arrResponse[5] == out2_in0_Lo)){ this.setRoutingState(2, 0, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out2_in1_Hi) && (arrResponse[5] == out2_in1_Lo)){ this.setRoutingState(2, 1, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out2_in2_Hi) && (arrResponse[5] == out2_in2_Lo)){ this.setRoutingState(2, 2, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out2_in3_Hi) && (arrResponse[5] == out2_in3_Lo)){ this.setRoutingState(2, 3, (arrResponse[8]==0x1E)); }

			if((arrResponse[4] == out3_in0_Hi) && (arrResponse[5] == out3_in0_Lo)){ this.setRoutingState(3, 0, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out3_in1_Hi) && (arrResponse[5] == out3_in1_Lo)){ this.setRoutingState(3, 1, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out3_in2_Hi) && (arrResponse[5] == out3_in2_Lo)){ this.setRoutingState(3, 2, (arrResponse[8]==0x1E)); }
			if((arrResponse[4] == out3_in3_Hi) && (arrResponse[5] == out3_in3_Lo)){ this.setRoutingState(3, 3, (arrResponse[8]==0x1E)); }

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
			
			//----Volume
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


			//if((arrResponse[4] == 0x01) && (arrResponse[5] == 0xD8)){ volume[0][1] = arrResponse[8]; this.setVolume(0)}
		} else {
			this.log.info('parseMsg() Response unhandled:' + msg );
		}
		
		tabu = false;
	}

	//----Fragt die Werte vom Geraet ab.
	queryMatrix(){

		tabu =true;
		this.log.info('AudioMatrix queryMatrix():' /*+ this.toHexString(cmd)*/);

		var arrQuery =[
			//----Routing
			new Buffer([0xf0, 0x45, idDevice, 0x10, out0_in0_Hi, out0_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out0_in1_Hi, out0_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out0_in2_Hi, out0_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out0_in3_Hi, out0_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, out1_in0_Hi, out1_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out1_in1_Hi, out1_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out1_in2_Hi, out1_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out1_in3_Hi, out1_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, out2_in0_Hi, out2_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out2_in1_Hi, out2_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out2_in2_Hi, out2_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out2_in3_Hi, out2_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, out3_in0_Hi, out3_in0_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out3_in1_Hi, out3_in1_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out3_in2_Hi, out3_in2_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, out3_in3_Hi, out3_in3_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			//----InGain
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_0_HiVal_Hi, inGain_0_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_0_LoVal_Hi, inGain_0_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_1_HiVal_Hi, inGain_1_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_1_LoVal_Hi, inGain_1_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_2_HiVal_Hi, inGain_2_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_2_LoVal_Hi, inGain_2_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_3_HiVal_Hi, inGain_3_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_3_LoVal_Hi, inGain_3_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_4_HiVal_Hi, inGain_4_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_4_LoVal_Hi, inGain_4_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_5_HiVal_Hi, inGain_5_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_5_LoVal_Hi, inGain_5_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_6_HiVal_Hi, inGain_6_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_6_LoVal_Hi, inGain_6_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_7_HiVal_Hi, inGain_7_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_7_LoVal_Hi, inGain_7_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),


			//----Volume
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_0_HiVal_Hi, vol_0_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_0_LoVal_Hi, vol_0_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_1_HiVal_Hi, vol_1_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_1_LoVal_Hi, vol_1_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_2_HiVal_Hi, vol_2_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_2_LoVal_Hi, vol_2_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_3_HiVal_Hi, vol_3_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_3_LoVal_Hi, vol_3_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_4_HiVal_Hi, vol_4_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_4_LoVal_Hi, vol_4_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_5_HiVal_Hi, vol_5_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_5_LoVal_Hi, vol_5_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_6_HiVal_Hi, vol_6_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_6_LoVal_Hi, vol_6_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_7_HiVal_Hi, vol_7_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, vol_7_LoVal_Hi, vol_7_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),

		];

		//this.log.info('AudioMatrix queryMatrix(): Array filled. Sending');
		arrQuery.forEach(function(item, index, array) {
			//parentThis.log.info(item + ":" +  index);
			tabu = true;
			parentThis.send(item, (index+1)*100);			
		});
		
	}
	
	send(cmd, iTimeout){
		//this.log.info('AudioMatrix send:' + cmd);
		
		if (cmd !== undefined){
			//this.log.info('AudioMatrix send:' + this.toHexString(cmd) + ' Timeout:' + iTimeout.toString() );
			//matrix.write(cmd);
			//tabu = false;
			setTimeout(function() {
            			matrix.write(cmd);            
		        }, iTimeout);
		}
		//this.log.info('send: tabu=FALSE' );
		tabu = false;	
	}
	

	//----Ein State wurde veraendert
	matrixchanged(id, val, ack){

	//-----Das muss noch gefit werden
	//		tabu = true;

		if (connection && val && !val.ack) {
			//this.log.info('matrixChanged: tabu=TRUE' );
			//tabu = true;
		}
		if(ack==false){
			if(id.toString().includes('.outputgain')){
				//this.log.info('matrixChanged: outputgain changed. ID:' + id.toString() );
				var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1));
				//this.log.info('matrixChanged: outputgain changed. ID:' + channelID.toString() );
				channelID-=1;

				channelID+=8;	//
				cmdGain[4] = channelID;
						
				val*=13.9;
				var loByte = val & 0xFF;
				var hiByte = (val >> 8) & 0xFF;

				cmdGain[7] = loByte;
				cmdGain[11] = hiByte;

				//----Speichern der STates				
				this.send(cmdGain, 5);
				
			}

			if(id.toString().includes('.inputgain')){
				//this.log.info('matrixChanged: inputgain changed. ID:' + id.toString());
				var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1));
				//this.log.info('matrixChanged: inputgain changed. ID:' + channelID.toString() );
				channelID-=1;	//

				

				cmdGain[4] = channelID;
						
				val*=13.9;
				var loByte = val & 0xFF;
				var hiByte = (val >> 8) & 0xFF;

				cmdGain[7] = loByte;
				cmdGain[11] = hiByte;
				
				this.send(cmdGain, 5);

			}

			if(id.toString().includes('.preset')){
				this.log.info('matrixChanged: preset changed. Recalled Preset:' + val.toString());
				if(val>0){
					val-=1;	//----Falls per Admin gesetzt und falsch gemacht
				}
				if(val>5){
					val=5;	//----Falls per Admin gesetzt und falsch gemacht
				}

				cmdPreset[4]=val;			
				this.send(cmdPreset, 5);

			}

			
			if(id.toString().includes('.outputroutestate_')){
				//this.log.info('matrixChanged: outputroutestate changed. ID:' + id.toString());
				//this.log.info('matrixChanged: outputroute changed via Button. ID:' + id.toString() + ' val:' + val.toString());
				var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1))-1;
				//this.log.info('matrixChanged: outputroutestate changed. channelID:' + channelID.toString() + ' val:' + val.toString() );
				
				var iAusgang = channelID % 8;
				var iEingang = (channelID-iAusgang)/8;
				
				cmdRoute[4] = iAusgang + 8;
				cmdRoute[10] = iEingang;
				if(val==true){
					this.log.info('matrixChanged: Eingang ' + iEingang.toString() + ' Ausgang ' + iAusgang.toString() + ' AN' );
					cmdRoute[11] = 30;
				}else{
					this.log.info('matrixChanged: Eingang ' + iEingang.toString() + ' Ausgang ' + iAusgang.toString() + ' AUS');
					cmdRoute[11] = 128;
				}

				this.send(cmdRoute, 10);
			}		

		}//----ack==FALSE		

	}


	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// Reset the connection indicator during startup
		this.setState('info.connection_net', false, true);
		this.setState('info.connection_hardware', false, true);
		this.setState('info.connection', false, true);

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		//this.log.info('config option1: ' + this.config.option1);
		//this.log.info('config option2: ' + this.config.option2);
		this.log.info('config Host: ' + this.config.host);
		this.log.info('config Port: ' + this.config.port);
		this.log.info('config Firmware: ' + this.config.firmware);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
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

		//----Anlegen der Eingaenge
		for (var i = 1; i < 9; i++) {
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
					desc: 'Ausgang UKU'
				},
				native: {},
			});
		}

		//----Anlegen der Ausgaenge
		for (var i = 1; i < 9; i++) {
			await this.setObjectAsync('outputgain_' + i.toString(), {
				type: 'state',
				common: {
					name: 'Output ' + i.toString() + " Gain",
					type: 'number',
					role: 'level.volume',
					read: true,
					write: true,
					min: 0,
					max: 100
				},
				native: {},
			});
		}

		//----Routing
/*
		for (var i = 1; i < 9; i++) {
			await this.setObjectAsync('outputroute_' + i.toString(), {
				type: 'state',
				common: {
					name: 'Output ' + i.toString() + " Routing",
					type: 'number',
					role: 'level',
					read: true,
					write: true,
					min: 1,
					max: 8
				},
				native: {},
			});
		}
*/

		//----Routing via Buttons; 0-indiziert, aber Anzeige beginnt bei '1'
		for (var i = 0; i < 8; i++) {
			for (var j = 0; j < 8; j++) {
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


		
		
		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates('*');

		/*
		setState examples
		you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
//		await this.setStateAsync('testVariable', true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
//		await this.setStateAsync('testVariable', { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
//		await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
//		let result = await this.checkPasswordAsync('admin', 'iobroker');
//		this.log.info('check user admin pw ioboker: ' + result);

//		result = await this.checkGroupAsync('admin', 'admin');
//		this.log.info('check group user admin group admin: ' + result);

		//----
		this.initmatrix();
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info('cleaned everything up...');
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
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
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
				this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			}
			this.matrixchanged(id, state.val, state.ack);
			
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
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
