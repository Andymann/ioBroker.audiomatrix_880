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
var polling_time = 10000;
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
		for (var i = 0, charsLength = str.length; i < charsLength; i += 2) {
		    chunks.push(str.substring(i, i + 2));
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
					parentThis.send(cmdConnect);
				}else{
					//parentThis.log.info('connectMatrix().connection==true, doing nothing');
					parentThis.log.info('connectMatrix().connection==true, idle, querying Matrix');
					parentThis.queryMatrix();
					if(bWaitingForResponse==true){
						parentThis.log.info('connectMatrix().connection==true, bWaitingForResponse==TRUE, aber Timeout');
						bWaitingForResponse = false;
					}
				}
			    }
			}, polling_time);
			if(cb){cb();}
	
		});
			
		matrix.on('data', function(chunk) {
			in_msg += parentThis.toHexString(chunk);
			//in_msg_raw += chunk;
			
			//if((in_msg.length==26) && (in_msg.toLowerCase().indexOf('f0')>-1) && (in_msg.toLowerCase().indexOf('f7')>-1)){
			if((in_msg.length==26) && (in_msg.toLowerCase().beginsWith('f0')) && (in_msg.toLowerCase().endsWith('f7'))){
				parentThis.log.info("AudioMatrix incomming: " + in_msg + " LENGTH: " + in_msg.length.toString());
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

	parseMsg(msg){
		this.log.info('parseMsg():' + msg);
		var arrResponse = this.toArray(msg);
		this.log.info('parseMsg() LEN:' + arrResponse.lebgth.toString() );
		if(!connection){


		}else{

		}
	}

	//----Fragt die Werte vom Geraet ab.
	queryMatrix(){
		tabu =true;
		this.log.info('AudioMatrix queryMatrix():' /*+ this.toHexString(cmd)*/);
		//----Falsches Device
		var cmdFalse = new Buffer([0xf0, 0x45, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
		cmdReadmemory[4] = 0;	//Hi
		cmdReadmemory[5] = 0x7d;	//Lo
		bWaitingForResponse = true;
		this.send(cmdReadmemory);

		//----Test
		var cmdReadRoute_1 = new Buffer([0xf0, 0x45, 0x01, 0x10, 0x00, 0x48, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
		var cmdReadRoute_2 = new Buffer([0xf0, 0x45, 0x01, 0x10, 0x00, 0x7d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf7]);
		var arrQuery = [cmdReadRoute_1, cmdReadRoute_2];

		arrQuery.forEach(function(item, index, array) {
			parentThis.log.info(item + ":" +  index);
		});
		
	}
	





	send(cmd){
		//this.log.info('AudioMatrix send:' + cmd);
		this.log.info('AudioMatrix send:' + this.toHexString(cmd));
		if (cmd !== undefined){
			//matrix.write(cmd);
			//tabu = false;
			setTimeout(function() {
            			matrix.write(cmd);            
		        }, 1);
		}
		this.log.info('send: tabu=FALSE' );
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
			
			this.send(cmdGain);
			
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
			
			this.send(cmdGain);

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
			this.send(cmdPreset);

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
			this.send(cmdReadmemory);
		}

		if(id.toString().includes('.readmemory_route_out_1')){
			
			this.log.info('matrixChanged: readmemory_route_out_1');
			var val = 0x40 + 0x08;
			var loAddress = val & 0xFF;
			var hiAddress = (val >> 8) & 0xFF;
			cmdReadmemory[4] = hiAddress;
			cmdReadmemory[5] = loAddress;			
			this.send(cmdReadmemory);
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
			this.matrixchanged(id, state.val);
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
