"use strict";

const Promise = require( "bluebird" );

const fs   = Promise.promisifyAll( require( "fs" ) );
const log  = require( "fm-log" ).module();
const path = require( "path" );

class SshService {
	getEnvironment() {
		const homePath = process.env.USERPROFILE || path.join( process.env.HOMEDRIVE, process.env.HOMEPATH );

		const agentEnv    = path.join( homePath, ".ssh", "agent.env" );
		const environment = path.join( homePath, ".ssh", "environment" );

		return Promise.any( [
				this.readSshData( agentEnv ),
				this.readSshData( environment )
			] )
			.then( sshData => {
				process.env.SSH_AGENT_PID = process.env.SSH_AGENT_PID || sshData.agentPid;
				process.env.SSH_AUTH_SOCK = process.env.SSH_AUTH_SOCK || sshData.authSock;
				log.notice( "Connection to ssh-agent established with:" );
				log.debug( `SSH_AGENT_PID: ${process.env.SSH_AGENT_PID}` );
				log.debug( `SSH_AUTH_SOCK: ${process.env.SSH_AUTH_SOCK}` );
			} )
			.catch( err => {
				log.error( "No agent data found." );
				throw err;
			} );
	}

	readSshData( envPath ) {
		if( process.env.SSH_AGENT_PID && process.env.SSH_AUTH_SOCK ) {
			return Promise.resolve( {
				authSock : process.env.SSH_AUTH_SOCK,
				agentPid : process.env.SSH_AGENT_PID
			} );
		}

		return fs.readFileAsync( envPath, {
				encoding : "utf-8"
			} )
			.then( content => {
				const matchData = content.match( /SSH_AUTH_SOCK=(.*?);.*\s*SSH_AGENT_PID=(.*?);.*/ );
				if( !matchData ) {
					log.error( "Invalid content" );
				} else {
					return {
						authSock : matchData[ 1 ],
						agentPid : matchData[ 2 ]
					};
				}
			} ).catch( err => {
				throw err;
			} );

	}
}

module.exports = new SshService();
