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
var tabu = false;
var polling_time = 20000;
var query = null;
var in_msg = '';
//var in_msg_raw = '';

var parentThis;

//----https://github.com/ioBroker/ioBroker/wiki/Adapter-Development-Documentation
//----https://github.com/ioBroker/ioBroker/blob/master/doc/SCHEMA.md
//----https://github.com/ioBroker/ioBroker/blob/master/doc/STATE_ROLES.md  => level.volume
var idDevice = 0x01;
var cmdConnect =	new Buffer([0xf0, 0x45, idDevice, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdDisconnect =	new Buffer([0xf0, 0x45, idDevice, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdGain =		new Buffer([0xf0, 0x45, idDevice, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdRoute =		new Buffer([0xf0, 0x45, idDevice, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdPreset =		new Buffer([0xf0, 0x45, idDevice, 0x1B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
var cmdReadmemory = 	new Buffer([0xf0, 0x45, idDevice, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);


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

var inGain_0_LoVal_Lo = 0xD8;
var inGain_0_LoVal_Hi = 0x01;
var inGain_1_LoVal_Lo = 0xD9;
var inGain_1_LoVal_Hi = 0x01;
var inGain_2_LoVal_Lo = 0xDA;
var inGain_2_LoVal_Hi = 0x01;
var inGain_3_LoVal_Lo = 0xDB;
var inGain_3_LoVal_Hi = 0x01;
var inGain_4_LoVal_Lo = 0xDC;
var inGain_4_LoVal_Hi = 0x01;
var inGain_5_LoVal_Lo = 0xDD;
var inGain_5_LoVal_Hi = 0x01;
var inGain_6_LoVal_Lo = 0xDE;
var inGain_6_LoVal_Hi = 0x01;
var inGain_7_LoVal_Lo = 0xDF;
var inGain_7_LoVal_Hi = 0x01;

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
		this.log.info('reconnectMatrix()');
		clearInterval(query);
		clearTimeout(recnt);
		matrix.destroy();
		this.setState('info.connection', false, true);
		this.log.info('Reconnect after 15 sec...');
		connection = false;
		recnt = setTimeout(function() {
			parentThis.initmatrix();
		}, 15000);
	}


	connectmatrix(cb){
		//this.log.info('connectMatrix().');
 		
		var host = this.config.host;// ? this.config.host : '192.168.1.56';
		var port = this.config.port;// ? this.config.port : 23;
		this.log.info('AudioMatrix connecting to: ' + this.config.host + ':' + this.config.port);

		matrix = new net.Socket();
		matrix.connect(this.config.port, this.config.host, function() {
			clearInterval(query);
			query = setInterval(function() {
			    if(!tabu){	//----Damit nicht gepolled wird, wenn gerade etwas anderes stattfindet.
				if(connection==false){
					parentThis.log.info('connectMatrix().connection==false, sending CMDCONNECT');
					parentThis.send(cmdConnect, 1);
				}else{
					//parentThis.log.info('connectMatrix().connection==true, doing nothing');
					parentThis.log.info('connectMatrix().connection==true, idle, querying Matrix');
					parentThis.queryMatrix();
					//if(bWaitingForResponse==true){
					//	parentThis.log.info('connectMatrix().connection==true, bWaitingForResponse==TRUE, aber Timeout');
					//	bWaitingForResponse = false;
					//}
				}
			    }
			}, polling_time);
			if(cb){cb();}
	
		});
			
		matrix.on('data', function(chunk) {
			in_msg += parentThis.toHexString(chunk);
			//in_msg_raw += chunk;
			//parentThis.log.info("AudioMatrix incoming PART: " + in_msg);
			//if((in_msg.length==26) && (in_msg.toLowerCase().indexOf('f0')>-1) && (in_msg.toLowerCase().indexOf('f7')>-1)){
			if(in_msg.toLowerCase().startsWith('f0')){
				if((in_msg.length == 26) && (in_msg.toLowerCase().endsWith('f7'))){
					parentThis.log.info("AudioMatrix incoming: " + in_msg + " LENGTH: " + in_msg.length.toString());
					//parentThis.log.info("AudioMatrix incomming RAW: " + in_msg_raw + " LENGTH:" + in_msg_raw.length.toString());
					/*
					if(connection == false){
						connection = true;
						parentThis.log.info('Matrix CONNECTED');
						parentThis.setState('info.connection', true, true);
						parentThis.queryMatrix();
					}
					in_msg= '';
					in_msg_raw = '';
					*/
					parentThis.parseMsg(in_msg);
					in_msg = '';
				}
			}else{
				//----Irgendwie vergneisgnaddelt
				in_msg = '';
			}

			//if(in_msg.length > 50){
			//	in_msg = '';
			//}
		});

		matrix.on('error', function(e) {
			if (e.code == "ENOTFOUND" || e.code == "ECONNREFUSED" || e.code == "ETIMEDOUT") {
				matrix.destroy();
			}
			parentThis.log.error(e);
		});

		matrix.on('close', function(e) {
			if(connection){
				parentThis.log.error('AudioMatrix disconnected');
			}
			parentThis.reconnect();
		});

	}


	setRoutingState(outIndex, inIndex, onoff){
		//this.log.info('setRoutingState() Out:' + outIndex.toString() + ' In:' + inIndex.toString() + ' Val:' + onoff.toString() );
		//this.log.info('setRoutingState() outputroutestate_' + (inIndex*8 + outIndex).toString());
		this.setStateAsync('outputroutestate_' + (inIndex*8 + outIndex).toString(), { val: onoff, ack: false });
	}

	setInputGain(gainIndex){
		this.log.info('setInputGain() gainIndex:' + gainIndex.toString() + ' Hi:' + inGain[gainIndex][0].toString() + ' Lo:' + inGain[gainIndex][1].toString() );
		if((inGain[gainIndex][0]>-1) && (inGain[gainIndex][1]>-1)){
			var gainVal = inGain[gainIndex][0]*256 + inGain[gainIndex][1];
			this.log.info('setInputGain() gainValue:' + gainVal.toString() );		

			inGain[gainIndex][0] = -1;
			inGain[gainIndex][1] = -1;	
		}
	}

	//----Verarbeitung ankommender Daten. alles ist asynchron.
	parseMsg(msg){
		tabu = true;
		this.log.info('parseMsg():' + msg);
		var arrResponse = this.toArray(msg);
		//this.log.info('parseMsg() LEN:' + arrResponse.length.toString() );

		if (arrResponse[3] == 0x00 ){
			this.log.info('parseMsg() Response = CONNECTION' );
			connection = true;
			this.setState('info.connection', true, true);
		}
		if (arrResponse[3] == 0x10 ){
			//this.log.info('parseMsg() Response = ReadMemory' );
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

			if((arrResponse[4] == inGain_0_HiVal_Hi) && (arrResponse[5] == inGain_0_HiVal_Lo)){ inGain[0][0] = arrResponse[8]; this.setInputGain(0)}
			if((arrResponse[4] == inGain_0_LoVal_Hi) && (arrResponse[5] == inGain_0_LoVal_Lo)){ inGain[0][1] = arrResponse[8]; this.setInputGain(0)}
			

		}
		tabu = false;
	}

	//----Fragt die Werte vom Geraet ab.
	queryMatrix(){

		tabu =true;
		this.log.info('AudioMatrix queryMatrix():' /*+ this.toHexString(cmd)*/);

		var arrQuery =[
			//----Routing
/*
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
*/
			//----InGain
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_0_HiVal_Hi, inGain_0_HiVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
			new Buffer([0xf0, 0x45, idDevice, 0x10, inGain_0_LoVal_Hi, inGain_0_LoVal_Lo, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]),
/*
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
*/
		];

		arrQuery.forEach(function(item, index, array) {
			//parentThis.log.info(item + ":" +  index);
			parentThis.send(item, (index+1)*100);
			tabu = true;
		});
		
	}
	
	send(cmd, iTimeout){
		//this.log.info('AudioMatrix send:' + cmd);
		
		if (cmd !== undefined){
			this.log.info('AudioMatrix send:' + this.toHexString(cmd) + ' Timeout:' + iTimeout.toString() );
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
	matrixchanged(id, val){


	//-----Das muss noch gefit werden
	//		tabu = true;

		if (connection && val && !val.ack) {
			//this.log.info('matrixChanged: tabu=TRUE' );
			//tabu = true;
		}
		if(id.toString().includes('.outputgain')){
			this.log.info('matrixChanged: outputgain changed. ID:' + id.toString() );
			//var outputid = id.toLowerCase().substring(id.lastIndexOf('_')+1, id.toLowerCase().lastIndexOf(' '));
			var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1));
			this.log.info('matrixChanged: outputgain changed. ID:' + channelID.toString() );
			//var channelID=id;
			channelID-=1;

			channelID+=8;	//
			cmdGain[4] = channelID;
					
			val*=13.9;
			var loByte = val & 0xFF;
			var hiByte = (val >> 8) & 0xFF;

			cmdGain[7] = loByte;
			cmdGain[11] = hiByte;

			//----Speichern der STates
			
			this.send(cmdGain, 1);
			
		}

		if(id.toString().includes('.inputgain')){
			this.log.info('matrixChanged: inputgain changed. ID:' + id.toString());
			//var outputid = id.toLowerCase().substring(id.lastIndexOf('_')+1, id.toLowerCase().lastIndexOf(' '));
			//var outputid = id.toLowerCase().substring(id.lastIndexOf('_')+1);
			//var channelID = id;
			var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1));
			this.log.info('matrixChanged: inputgain changed. ID:' + channelID.toString() );
			channelID-=1;	//

			

			cmdGain[4] = channelID;
					
			val*=13.9;
			var loByte = val & 0xFF;
			var hiByte = (val >> 8) & 0xFF;

			cmdGain[7] = loByte;
			cmdGain[11] = hiByte;
			
			this.send(cmdGain, 1);

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
			this.send(cmdPreset, 1);

		}
/*
		if(id.toString().includes('.outputroutestate_')){
			this.log.info('matrixChanged: outputroute changed via Button. ID:' + id.toString() + ' val:' + val.toString());
		}
*/
		
		if(id.toString().includes('.outputroutestate_')){
			//this.log.info('matrixChanged: outputroutestate changed. ID:' + id.toString());
			//this.log.info('matrixChanged: outputroute changed via Button. ID:' + id.toString() + ' val:' + val.toString());
			var channelID = parseInt(id.toLowerCase().substring(id.lastIndexOf('_')+1));
			this.log.info('matrixChanged: outputroutestate changed. channelID:' + channelID.toString() + ' val:' + val.toString() );
			
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

			this.send(cmdRoute);
		}

		if(id.toString().includes('.readmemory_preset')){
			
			this.log.info('matrixChanged: readmemory_preset');
			var val = 0x40;
			var loAddress = val & 0xFF;
			var hiAddress = (val >> 8) & 0xFF;
			cmdReadmemory[4] = hiAddress;
			cmdReadmemory[5] = loAddress;			
			this.send(cmdReadmemory, 1);
		}

		if(id.toString().includes('.readmemory_route_out_1')){
			
			this.log.info('matrixChanged: readmemory_route_out_1');
			var val = 0x40 + 0x08;
			var loAddress = val & 0xFF;
			var hiAddress = (val >> 8) & 0xFF;
			cmdReadmemory[4] = hiAddress;
			cmdReadmemory[5] = loAddress;			
			this.send(cmdReadmemory, 1);
		}

		

	}


	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// Reset the connection indicator during startup
		this.setState('info.connection', false, true);

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		//this.log.info('config option1: ' + this.config.option1);
		//this.log.info('config option2: ' + this.config.option2);
		this.log.info('config Host: ' + this.config.host);
		this.log.info('config Port: ' + this.config.port);

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

		//----Routing via Buttons
		for (var i = 0; i < 8; i++) {
			for (var j = 0; j < 8; j++) {
				//await this.setObjectAsync('outputroutestate_' + i.toString() + '-' + j.toString(), {
				await this.setObjectAsync('outputroutestate_' + (i*8 + j).toString(), {
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


		await this.setObjectAsync('readmemory_preset', {
			type: 'state',
			common: {
				name: 'readmemory_preset',
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: false,
			},
			native: {},
		});

		await this.setObjectAsync('readmemory_route_out_1', {
			type: 'state',
			common: {
				name: 'readmemory_route_out_1',
				type: 'boolean',
				role: 'indicator',
				read: true,
				write: false,
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
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			if(state.ack){
				this.matrixchanged(id, state.val);
			}
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
